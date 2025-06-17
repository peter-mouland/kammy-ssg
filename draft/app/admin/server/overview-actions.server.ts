// /admin/server/overview-actions.server.ts - UPDATED WITH CACHE ACTIONS
import type { AdminActionResult, ClearVariant } from '../types';

interface OverviewActionParams {
    actionType: string;
    variant?: ClearVariant;
    divisionId?: string;
}

export async function handleOverviewActions(params: OverviewActionParams): Promise<AdminActionResult> {
    const { actionType, variant, divisionId } = params;

    try {
        switch (actionType) {
            // Data Management Actions for Overview
            case "clearFirestoreData": {
                const { handleClearFirestoreData } = await import('./actions/data-actions');
                return await handleClearFirestoreData({ actionType, variant });
            }
            case "getFirestoreStats": {
                const { handleGetFirestoreStats } = await import('./actions/data-actions');
                return await handleGetFirestoreStats({ actionType });
            }
            case "populateBootstrapData": {
                const { handlePopulateBootstrapData } = await import('./actions/data-actions');
                return await handlePopulateBootstrapData();
            }
            case "generateEnhancedDataFast": {
                const { handleGenerateEnhancedDataFast } = await import('./actions/data-actions');
                return await handleGenerateEnhancedDataFast();
            }
            case "populateElementSummaries": {
                const { handlePopulateElementSummaries } = await import('./actions/data-actions');
                return await handlePopulateElementSummaries();
            }
            // System Actions for Overview
            case "getCacheStatus": {
                const { handleGetCacheStatus } = await import('./actions/system-actions');
                return await handleGetCacheStatus();
            }
            // Cache Monitoring Actions
            case "getCacheStats": {
                const { handleGetCacheStats } = await import('./actions/cache-monitor-actions');
                return await handleGetCacheStats();
            }
            case "clearCache": {
                const { handleClearCache } = await import('./actions/cache-monitor-actions');
                return await handleClearCache();
            }
            case "invalidateDraftCache": {
                const { handleInvalidateDraftCache } = await import('./actions/cache-monitor-actions');
                return await handleInvalidateDraftCache({ actionType, divisionId });
            }
            // Points Actions accessible from Overview
            case "generateGameWeekPoints": {
                const { handleGenerateGameweekPoints } = await import('./actions/points-actions');
                return await handleGenerateGameweekPoints();
            }
            default:
                throw new Error(`Invalid overview action type: ${actionType}`);
        }
    } catch (error) {
        console.error(`Overview action error [${actionType}]:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to execute ${actionType}: ${message}`);
    }
}
