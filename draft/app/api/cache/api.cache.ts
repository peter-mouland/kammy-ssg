// app/api/cache/api.cache.ts

import type { LoaderFunctionArgs } from 'react-router';
import { data } from 'react-router';
import { getCacheTTL } from '../../_shared/lib/cache/cache-config';
import { dataCache } from '../../_shared/lib/cache/data-cache.service';

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
