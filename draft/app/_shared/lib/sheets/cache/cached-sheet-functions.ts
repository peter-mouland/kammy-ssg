// /_shared/lib/sheets/cache/cached-sheet-functions.ts
import { sheetsCache } from './sheets-cache-service';

/**
 * Cache invalidation helpers - call these when data changes
 */
export const cacheInvalidation = {
    /**
     * Invalidate after draft state changes (picks made, state updated)
     */
    invalidateDraftData(divisionId?: string) {
        sheetsCache.invalidate('draft-state');
        sheetsCache.invalidate('draft-picks-all');

        if (divisionId) {
            sheetsCache.invalidate(`draft-picks-division-${divisionId}`);
        } else {
            // Invalidate all division draft picks
            sheetsCache.invalidatePattern('draft-picks-division-');
        }

        console.log('📋 Invalidated draft data cache');
    },

    /**
     * Invalidate after teams/users change
     */
    invalidateTeamData(divisionId?: string) {
        sheetsCache.invalidate('user-teams-all');

        if (divisionId) {
            sheetsCache.invalidate(`user-teams-division-${divisionId}`);
        } else {
            sheetsCache.invalidatePattern('user-teams-division-');
        }

        console.log('📋 Invalidated team data cache');
    },

    /**
     * Invalidate after draft order changes
     */
    invalidateDraftOrderData(divisionId?: string) {
        sheetsCache.invalidate('draft-orders-all');

        if (divisionId) {
            sheetsCache.invalidate(`draft-order-division-${divisionId}`);
        } else {
            sheetsCache.invalidatePattern('draft-order-division-');
        }

        console.log('📋 Invalidated draft order cache');
    },

    /**
     * Invalidate after divisions change (rare)
     */
    invalidateDivisionData() {
        sheetsCache.invalidate('divisions');
        console.log('📋 Invalidated division data cache');
    },

    /**
     * Clear all cache (for emergencies)
     */
    clearAll() {
        sheetsCache.clear();
        console.log('📋 Cleared all cache');
    }
};

/**
 * Cache monitoring for admin dashboard
 */
export function getCacheStats() {
    return {
        ...sheetsCache.getStats(),
        keys: sheetsCache.getKeys(),
        keysByPattern: {
            draftState: sheetsCache.getKeys().filter(k => k.includes('draft-state')),
            draftPicks: sheetsCache.getKeys().filter(k => k.includes('draft-picks')),
            userTeams: sheetsCache.getKeys().filter(k => k.includes('user-teams')),
            draftOrders: sheetsCache.getKeys().filter(k => k.includes('draft-order')),
            divisions: sheetsCache.getKeys().filter(k => k.includes('divisions'))
        }
    };
}
