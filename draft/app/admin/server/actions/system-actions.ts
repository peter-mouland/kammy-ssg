// /admin/server/actions/system-actions.ts
import type { AdminActionResult } from "../../types";

// IMPROVED version of "getCacheStatus" to provide better data structure
export async function handleGetCacheStatus(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Getting cache status...');

        const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');

        const cacheHealth = await fplApiCache.getCacheHealth();

        return {
            success: true,
            message: `Cache status retrieved - ${cacheHealth.health?.overall || 'unknown'}`,
            data: cacheHealth
        };
    } catch (error) {
        console.error('Get cache status error:', error);

        // Return safe fallback data structure on error
        return {
            success: false,
            message: 'Failed to get cache status',
            data: {
                health: { overall: 'critical' },
                completionPercentage: 0,
                counts: {
                    teams: 0,
                    events: 0,
                    elements: 0,
                    elementSummaries: 0,
                },
                missing: {
                    teams: true,
                    events: true,
                    elements: true,
                    elementSummaries: true,
                }
            }
        };
    }
}
