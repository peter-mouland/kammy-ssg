// app/admin/lib/admin-context-helpers.ts
/** biome-ignore-all lint/style/useNamingConvention: <explanation> */

/**
 * Helper functions for admin context cache management
 * Use these after making changes that should invalidate the cache
 */

/**
 * Invalidate admin context cache via API call
 * Call this after making changes that affect system status
 */
export async function invalidateAdminContext(reason: string): Promise<void> {
    try {
        console.log(`🗑️ Invalidating admin context: ${reason}`);

        const response = await fetch('/api/cache', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                actionType: 'invalidate',
                reason: reason,
            }),
        });

        if (!response.ok) {
            console.error('Failed to invalidate admin context:', response.statusText);
        }
    } catch (error) {
        console.error('Failed to invalidate admin context:', error);
    }
}

/**
 * Refresh admin context cache immediately
 * Use this when you need fresh data right away
 */
export async function refreshAdminContext(): Promise<any> {
    try {
        console.log('🔄 Refreshing admin context...');

        const response = await fetch('/api/cache', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                actionType: 'refresh',
            }),
        });

        if (!response.ok) {
            console.error('Failed to refresh admin context:', response.statusText);
            return null;
        }

        const result = await response.json();
        return result.data?.context;
    } catch (error) {
        console.error('Failed to refresh admin context:', error);
        return null;
    }
}

/**
 * Get admin context cache status for debugging
 */
export async function getAdminContextStatus(): Promise<any> {
    try {
        const response = await fetch('/api/cache?action=status');

        if (!response.ok) {
            console.error('Failed to get admin context status:', response.statusText);
            return null;
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Failed to get admin context status:', error);
        return null;
    }
}

/**
 * Hook for React components to manage admin context
 */
export function useAdminContextInvalidation() {
    return {
        invalidate: invalidateAdminContext,
        refresh: refreshAdminContext,
        getStatus: getAdminContextStatus,
    };
}

/**
 * Common invalidation scenarios - use these for consistency
 */
export const INVALIDATION_REASONS = {
    // Draft operations
    DRAFT_STARTED: 'Draft started',
    DRAFT_SYNCED: 'Draft synced to Firebase',
    DRAFT_COMPLETED: 'Draft completed',
    DRAFT_RESET: 'Draft reset',

    // Transfer operations
    TRANSFER_SUBMITTED: 'Transfer submitted',
    TRANSFER_APPROVED: 'Transfer approved',
    TRANSFER_REJECTED: 'Transfer rejected',
    TRANSFERS_PROCESSED: 'Transfers processed',

    // Gameweek operations
    GAMEWEEK_PROCESSED: 'Gameweek processed',
    POINTS_CALCULATED: 'Points calculated',
    STANDINGS_UPDATED: 'Standings updated',

    // Data operations
    FPL_DATA_REFRESHED: 'FPL data refreshed',
    CACHE_CLEARED: 'Cache cleared',
    SHEETS_UPDATED: 'Google Sheets updated',

    // Manual operations
    MANUAL_REFRESH: 'Manual refresh',
    ADMIN_ACTION: 'Admin action performed',
} as const;

/**
 * Example usage in action handlers:
 *
 * // After submitting a transfer
 * await submitTransfer(transferData);
 * await invalidateAdminContext(INVALIDATION_REASONS.TRANSFER_SUBMITTED);
 *
 * // After processing gameweek
 * await processGameweek(gameweekNumber);
 * await invalidateAdminContext(INVALIDATION_REASONS.GAMEWEEK_PROCESSED);
 *
 * // After refreshing FPL data
 * await refreshFplData();
 * await invalidateAdminContext(INVALIDATION_REASONS.FPL_DATA_REFRESHED);
 */
