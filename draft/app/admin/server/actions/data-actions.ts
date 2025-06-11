// /admin/server/actions/cache-actions.ts
import { FirestoreClearService } from "../../../_shared/lib/firestore-cache/clear-service";
import type { AdminActionParams, AdminActionResult } from "../../types";

// Helper function from original
function isValidAdminToken(token: string): boolean {
    const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-token';
    return token === adminToken;
}

// EXACT COPY from "clearFirestoreData" case
export async function handleClearFirestoreData(params: AdminActionParams): Promise<AdminActionResult> {
    const { variant: clearVariant = 'all' } = params;
    const clearService = new FirestoreClearService();

    try {
        switch (clearVariant) {
            case 'all':
                await clearService.clearAllData();
                break;
            case 'fpl-only':
                await clearService.clearFplCacheOnly();
                break;
            case 'elements-only':
                await clearService.clearElementSummariesOnly();
                break;
            default:
                throw new Error(`Invalid clear variant: ${clearVariant}`);
        }

        return {
            success: true,
            message: `Firestore data cleared successfully (${clearVariant})`
        };
    } catch (error) {
        console.error('Clear firestore data error:', error);
        throw new Error(`Failed to clear firestore data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function handleGetFirestoreStats(params: AdminActionParams): Promise<AdminActionResult> {

    try {
        const clearService = new FirestoreClearService();
        const [stats, estimate] = await Promise.all([
            clearService.getCollectionStats(),
            clearService.estimateClearTime()
        ]);

        return {
            success: true,
            data: { stats, estimate, timestamp: new Date().toISOString() }
        };
    } catch (error) {
        console.error('Get firestore stats error:', error);
        throw new Error(`Failed to get firestore stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function handlePopulateBootstrapData(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Populating bootstrap data...');

        const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');

        const result = await fplApiCache.preloadCommonData({
            includeBootstrap: true,
            includeEnhancedData: false,
            includeElementSummaries: false,
            forceRefresh: true
        });

        return {
            success: true,
            message: `Bootstrap data populated! ${result.results.bootstrap?.elements?.length || 0} players loaded`,
            data: result
        };
    } catch (error) {
        console.error('Populate bootstrap data error:', error);
        throw new Error(`Failed to populate bootstrap data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// EXACT COPY from "generateEnhancedDataFast" case
export async function handleGenerateEnhancedDataFast(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Generating enhanced data (fast mode)...');

        const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');

        const result = await fplApiCache.preloadCommonData({
            includeBootstrap: false,
            includeEnhancedData: true,
            includeElementSummaries: false,
            forceRefresh: true,
            skipDetailedStats: false
        });

        return {
            success: true,
            message: `Enhanced data generated (fast)! ${result.results.enhanced?.length || 0} players with basic draft calculations`,
            data: result
        };
    } catch (error) {
        console.error('Generate enhanced data (fast) error:', error);
        throw new Error(`Failed to generate enhanced data (fast): ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// EXACT COPY from "populateElementSummaries" case
export async function handlePopulateElementSummaries(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Populating element summaries...');

        const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');

        const result = await fplApiCache.preloadCommonData({
            includeBootstrap: false,
            includeEnhancedData: false,
            includeElementSummaries: true,
            forceRefresh: true
        });

        return {
            success: true,
            message: `Element summaries populated! ${Object.keys(result.results.elementSummaries || {}).length} players with detailed stats`,
            data: result
        };
    } catch (error) {
        console.error('Populate element summaries error:', error);
        throw new Error(`Failed to populate element summaries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
