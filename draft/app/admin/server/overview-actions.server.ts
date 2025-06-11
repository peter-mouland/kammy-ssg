// /admin/server/overview-actions.server.ts
import type { AdminActionResult, ClearVariant } from '../types';

interface OverviewActionParams {
    actionType: string;
    variant?: ClearVariant;
}

export async function handleOverviewActions(params: OverviewActionParams): Promise<AdminActionResult> {
    const { actionType, variant } = params;

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
