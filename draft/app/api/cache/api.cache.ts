// app/api/cache/api.cache.ts

import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { data } from 'react-router';
import { getCacheTTL, getInvalidationKeys } from '../../_shared/lib/cache/cache-config';
import { dataCache } from '../../_shared/lib/cache/data-cache.service';
import { requestFormData } from '../../_shared/lib/form-data';

interface CacheApiResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

/**
 * GET /api/cache - Get cache information and statistics
 */
export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action') || 'status';
        const key = url.searchParams.get('key');

        switch (action) {
            case 'status': {
                const stats = dataCache.getStats();
                const keys = dataCache.getKeys();

                return data<CacheApiResponse>({
                    success: true,
                    message: 'Cache status retrieved',
                    data: {
                        stats,
                        keyCount: keys.length,
                        keys: keys.slice(0, 20), // Only show first 20 keys to avoid huge responses
                        hasMoreKeys: keys.length > 20,
                        endpoints: {
                            status: '/api/cache?action=status',
                            info: '/api/cache?action=info&key=CACHE_KEY',
                            invalidate: 'POST /api/cache with action=invalidate&key=CACHE_KEY',
                            clear: 'POST /api/cache with action=clear',
                        },
                    },
                });
            }

            case 'info': {
                if (!key) {
                    return data<CacheApiResponse>(
                        {
                            success: false,
                            error: 'key parameter is required for info action',
                            message: 'key parameter is required for info action',
                        },
                        { status: 400 },
                    );
                }

                const info = dataCache.getCacheInfo(key);
                const ttl = getCacheTTL(key);

                return data<CacheApiResponse>({
                    success: true,
                    message: `Cache info for key: ${key}`,
                    data: {
                        key,
                        ...info,
                        configuredTtl: ttl,
                    },
                });
            }

            case 'keys': {
                const pattern = url.searchParams.get('pattern');
                const keys = dataCache.getKeys();
                const filteredKeys = pattern ? keys.filter((k) => k.includes(pattern)) : keys;

                return data<CacheApiResponse>({
                    success: true,
                    message: pattern ? `Cache keys matching pattern: ${pattern}` : 'All cache keys',
                    data: {
                        keys: filteredKeys,
                        total: filteredKeys.length,
                        pattern,
                    },
                });
            }

            default:
                return data<CacheApiResponse>(
                    {
                        success: false,
                        message: `Unknown action: ${action}. Valid actions: status, info, keys`,
                        error: `Unknown action: ${action}. Valid actions: status, info, keys`,
                    },
                    { status: 400 },
                );
        }
    } catch (error) {
        console.error('Cache API loader error:', error);
        return data<CacheApiResponse>(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get cache info',
                error: 'Failed to get cache info',
            },
            { status: 500 },
        );
    }
}

/**
 * POST /api/cache - Cache management actions
 */
export async function action({ request }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await requestFormData({ request });
        const actionType = formData.get('action')?.trim();

        if (!actionType) {
            return data<CacheApiResponse>(
                {
                    success: false,
                    error: 'action parameter is required',
                    message: 'action parameter is required',
                },
                { status: 400 },
            );
        }

        switch (actionType) {
            case 'invalidate': {
                const key = formData.get('key')?.trim();
                const pattern = formData.get('pattern')?.trim();
                const reason = formData.get('reason')?.trim() || 'Manual invalidation';

                if (key) {
                    // Invalidate specific key
                    const deleted = dataCache.invalidate(key);
                    console.log(`🗑️ POST /api/cache - invalidate key: ${key} - ${reason}`);

                    return data<CacheApiResponse>({
                        success: true,
                        message: deleted ? `Cache key invalidated: ${key}` : `Cache key not found: ${key}`,
                        data: {
                            invalidatedAt: new Date().toISOString(),
                            reason,
                            key,
                            deleted,
                        },
                    });
                } else if (pattern) {
                    // Invalidate by pattern
                    const deletedCount = dataCache.invalidatePattern(pattern);
                    console.log(`🗑️ POST /api/cache - invalidate pattern: ${pattern} - ${reason}`);

                    return data<CacheApiResponse>({
                        success: true,
                        message: `Cache pattern invalidated: ${pattern} (${deletedCount} entries)`,
                        data: {
                            invalidatedAt: new Date().toISOString(),
                            reason,
                            pattern,
                            deletedCount,
                        },
                    });
                } else {
                    return data<CacheApiResponse>(
                        {
                            success: false,
                            message: 'Either key or pattern parameter is required for invalidate action',
                            error: 'Either key or pattern parameter is required for invalidate action',
                        },
                        { status: 400 },
                    );
                }
            }

            case 'invalidate-multiple': {
                const keysParam = formData.get('keys')?.trim();
                const reason = formData.get('reason')?.trim() || 'Bulk invalidation';

                if (!keysParam) {
                    return data<CacheApiResponse>(
                        {
                            success: false,
                            message: 'keys parameter is required (comma-separated list)',
                            error: 'keys parameter is required (comma-separated list)',
                        },
                        { status: 400 },
                    );
                }

                const keys = keysParam
                    .split(',')
                    .map((k) => k.trim())
                    .filter(Boolean);
                const deletedCount = dataCache.invalidateMultiple(keys);
                console.log(`🗑️ POST /api/cache - invalidate multiple: ${keys.length} keys - ${reason}`);

                return data<CacheApiResponse>({
                    success: true,
                    message: `Bulk cache invalidation: ${deletedCount}/${keys.length} keys invalidated`,
                    data: {
                        invalidatedAt: new Date().toISOString(),
                        reason,
                        requestedKeys: keys,
                        deletedCount,
                    },
                });
            }

            case 'invalidate-by-action': {
                const actionName = formData.get('actionName')?.trim() as keyof typeof getInvalidationKeys | undefined;
                const params = formData.get('params')?.trim();
                const reason = formData.get('reason')?.trim() || `Action-based invalidation: ${actionName}`;

                if (!actionName) {
                    return data<CacheApiResponse>(
                        {
                            success: false,
                            message: 'actionName parameter is required',
                            error: 'actionName parameter is required',
                        },
                        { status: 400 },
                    );
                }

                try {
                    const parsedParams = params ? JSON.parse(params) : [];
                    const keysToInvalidate = getInvalidationKeys(actionName, ...parsedParams);

                    // Invalidate specific keys and patterns
                    let totalDeleted = 0;
                    for (const key of keysToInvalidate) {
                        if (key.endsWith(':')) {
                            // It's a pattern
                            totalDeleted += dataCache.invalidatePattern(key);
                        } else {
                            // It's a specific key
                            if (dataCache.invalidate(key)) totalDeleted++;
                        }
                    }

                    console.log(`🗑️ POST /api/cache - invalidate by action: ${actionName} - ${reason}`);

                    return data<CacheApiResponse>({
                        success: true,
                        message: `Action-based cache invalidation: ${actionName} (${totalDeleted} entries invalidated)`,
                        data: {
                            invalidatedAt: new Date().toISOString(),
                            reason,
                            actionName,
                            params: parsedParams,
                            keysToInvalidate,
                            deletedCount: totalDeleted,
                        },
                    });
                } catch (error) {
                    return data<CacheApiResponse>(
                        {
                            success: false,
                            message: `Invalid params JSON or unknown action: ${actionName}`,
                            error: `Invalid params JSON or unknown action: ${actionName}`,
                        },
                        { status: 400 },
                    );
                }
            }

            case 'clear': {
                const reason = formData.get('reason')?.trim() || 'Manual cache clear';

                console.log(`🧹 POST /api/cache - clear all cache - ${reason}`);
                dataCache.clear();

                return data<CacheApiResponse>({
                    success: true,
                    message: 'All cache cleared',
                    data: {
                        clearedAt: new Date().toISOString(),
                        reason,
                        stats: dataCache.getStats(),
                    },
                });
            }

            case 'warmup': {
                const keys = formData.get('keys')?.trim();

                if (!keys) {
                    return data<CacheApiResponse>(
                        {
                            success: false,
                            error: 'keys parameter is required for warmup (comma-separated list)',
                            message: 'keys parameter is required for warmup (comma-separated list)',
                        },
                        { status: 400 },
                    );
                }

                // Note: Warmup would need to be implemented per domain
                // This is a placeholder for the concept
                console.log(`🔥 POST /api/cache - warmup request for keys: ${keys}`);

                return data<CacheApiResponse>({
                    success: true,
                    message: 'Cache warmup initiated (implementation needed per domain)',
                    data: {
                        warmedUpAt: new Date().toISOString(),
                        requestedKeys: keys.split(',').map((k) => k.trim()),
                        note: 'Warmup requires domain-specific implementation',
                    },
                });
            }

            default:
                return data<CacheApiResponse>(
                    {
                        success: false,
                        error: `Unknown action: ${actionType}. Valid actions: invalidate, invalidate-multiple, invalidate-by-action, clear, warmup`,
                        message: `Unknown action: ${actionType}. Valid actions: invalidate, invalidate-multiple, invalidate-by-action, clear, warmup`,
                    },
                    { status: 400 },
                );
        }
    } catch (error) {
        console.error('Cache API action error:', error);
        return data<CacheApiResponse>(
            {
                success: false,
                error: 'Failed to perform cache action',
                message: error instanceof Error ? error.message : 'Failed to perform cache action',
            },
            { status: 500 },
        );
    }
}
