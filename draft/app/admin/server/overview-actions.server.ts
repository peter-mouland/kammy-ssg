// /admin/server/overview-actions.server.ts - UPDATED WITH CACHE ACTIONS

import type { DivisionId } from '../../teams/types/team-types';
import type { AdminActionResult, ClearVariant } from '../types/admin-types';
import { getSystemStatus } from './services/system-status.service';

interface OverviewActionParams {
    actionType: string;
    variant?: ClearVariant;
    divisionId?: DivisionId;
}

export async function handleOverviewActions(params: OverviewActionParams): Promise<AdminActionResult> {
    const { actionType, variant, divisionId } = params;

    try {
        switch (actionType) {
            // Data Management Actions for Overview
            case 'clearFirestoreData': {
                const { handleClearFirestoreData } = await import('./actions/data-actions');
                return await handleClearFirestoreData({ actionType, variant });
            }
            case 'getFirestoreStats': {
                const { handleGetFirestoreStats } = await import('./actions/data-actions');
                return await handleGetFirestoreStats({ actionType });
            }
            case 'populateBootstrapData': {
                const { handlePopulateBootstrapData } = await import('./actions/data-actions');
                return await handlePopulateBootstrapData();
            }
            case 'generateEnhancedDataFast': {
                const { handleGenerateEnhancedData } = await import('./actions/data-actions');
                return await handleGenerateEnhancedData();
            }
            case 'populateElementDetailedStats': {
                const { handlePopulateElementDetailedStats } = await import('./actions/data-actions');
                return await handlePopulateElementDetailedStats();
            }
            // System Actions for Overview
            case 'getCacheStatus': {
                const systemStatus = await getSystemStatus();
                return systemStatus;
            }
            // Cache Monitoring Actions
            case 'getCacheStats': {
                const { dataCache } = await import('../../_shared/lib/cache/data-cache.service');
                return dataCache.getStats();
            }
            case 'clearCache': {
                const { dataCache } = await import('../../_shared/lib/cache/data-cache.service');
                return dataCache.clear();
            }
            case 'invalidateDraftCache': {
                const { dataCache } = await import('../../_shared/lib/cache/data-cache.service');
                const { getInvalidationKeys } = await import('../../_shared/lib/cache/cache-config');
                const keysToInvalidate = getInvalidationKeys('DRAFT_ACTION', divisionId);
                return dataCache.invalidateMultiple(keysToInvalidate);
            }
            // Points Actions accessible from Overview
            case 'generateGameWeekPoints': {
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
