// /admin/server/actions/cache-monitor-actions.ts
import { getCacheStats, cacheInvalidation } from '../../../_shared/lib/sheets/cache/cached-sheet-functions';
import type { AdminActionParams, AdminActionResult } from '../../types/admin-types';

export async function handleGetCacheStats(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Getting cache statistics...');

        const stats = getCacheStats();

        return {
            success: true,
            message: `Cache stats retrieved - ${stats.hitRate} hit rate`,
            data: stats,
        };
    } catch (error) {
        console.error('Get cache stats error:', error);
        return {
            success: false,
            message: 'Failed to get cache statistics',
            data: {
                hits: 0,
                misses: 0,
                evictions: 0,
                hitRate: '0%',
                cacheSize: 0,
                maxSize: 100,
                keys: [],
                keysByPattern: {
                    draftState: [],
                    draftPicks: [],
                    userTeams: [],
                    draftOrders: [],
                    divisions: [],
                },
            },
        };
    }
}

export async function handleClearCache(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Clearing all cache...');

        cacheInvalidation.clearAll();

        return {
            success: true,
            message: 'All cache cleared successfully',
        };
    } catch (error) {
        console.error('Clear cache error:', error);
        throw new Error(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function handleInvalidateDraftCache(params: AdminActionParams): Promise<AdminActionResult> {
    const { divisionId } = params;

    try {
        console.log(`🔄 Invalidating draft cache for division: ${divisionId || 'all'}...`);

        if (divisionId) {
            cacheInvalidation.invalidateDraftData(divisionId);
        } else {
            cacheInvalidation.invalidateDraftData();
        }

        return {
            success: true,
            message: `Draft cache invalidated${divisionId ? ` for division ${divisionId}` : ' for all divisions'}`,
        };
    } catch (error) {
        console.error('Invalidate draft cache error:', error);
        throw new Error(
            `Failed to invalidate draft cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}
