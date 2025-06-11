// /admin/server/admin-dashboard.server.ts
import { AdminDraftService } from './services/admin-draft-service';
import type { AdminActionParams, AdminActionResult, AdminDashboardData } from '../types';

// Action handlers
import {
    handleGenerateOrder,
    handleClearOrder,
    handleStartDraft,
    handleStopDraft,
    handleSyncDraft
} from './actions/draft-actions';

import {
    handleClearFirestoreData,
    handleGetFirestoreStats,
    handlePopulateBootstrapData,
    handleGenerateEnhancedDataFast,
    handlePopulateElementSummaries
} from './actions/data-actions';

import {
    handleGenerateGameweekPoints,
    handleForceRegenerateAllPoints,
    handleGetGameweekPointsStatus
} from './actions/points-actions';

import {
    handleGetCacheStatus
} from './actions/system-actions';

/**
 * Main data loader for admin dashboard
 */
export async function getDraftAdminData(): Promise<AdminDashboardData> {
    return await AdminDraftService.getDraftAdminData();
}

/**
 * Main action handler - routes to specific action handlers
 */
export async function handleDraftAction(params: AdminActionParams): Promise<AdminActionResult> {
    const { actionType } = params;

    try {
        switch (actionType) {
            // Draft Management Actions
            case "generateOrder":
                return await handleGenerateOrder(params);
            case "clearOrder":
                return await handleClearOrder(params);
            case "startDraft":
                return await handleStartDraft(params);
            case "stopDraft":
                return await handleStopDraft();
            case "syncDraft":
                return await handleSyncDraft(params);

            // Data Management Actions
            case "clearFirestoreData":
                return await handleClearFirestoreData(params);
            case "getFirestoreStats":
                return await handleGetFirestoreStats(params);
            case "populateBootstrapData":
                return await handlePopulateBootstrapData();
            case "generateEnhancedDataFast":
                return await handleGenerateEnhancedDataFast();
            case "populateElementSummaries":
                return await handlePopulateElementSummaries();

            // Points Management Actions
            case "generateGameWeekPoints":
                return await handleGenerateGameweekPoints();
            case "forceRegenerateAllPoints":
                return await handleForceRegenerateAllPoints();
            case "getGameweekPointsStatus":
                return await handleGetGameweekPointsStatus();

            // System Actions
            case "getCacheStatus":
                return await handleGetCacheStatus();

            default:
                throw new Error(`Invalid action type: ${actionType}`);
        }
    } catch (error) {
        console.error(`Admin action error [${actionType}]:`, error);

        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to execute ${actionType}: ${message}`);
    }
}
