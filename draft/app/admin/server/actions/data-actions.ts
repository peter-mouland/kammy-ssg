/* Location: app/admin/server/actions/data-actions.ts */

// /admin/server/actions/cache-actions.ts
import { FirestoreClearService } from '../../../_shared/lib/firestore-cache/clear-service';
import type { AdminActionParams, AdminActionResult } from '../../types/admin-types';

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
                await clearService.clearFplFirestoreOnly();
                break;
            case 'elements-only':
                await clearService.clearElementDetailedStatsOnly();
                break;
            default:
                throw new Error(`Invalid clear variant: ${clearVariant}`);
        }

        return {
            success: true,
            message: `Firestore data cleared successfully (${clearVariant})`,
        };
    } catch (error) {
        console.error('Clear firestore data error:', error);
        throw new Error(`Failed to clear firestore data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function handleGetFirestoreStats(_params: AdminActionParams): Promise<AdminActionResult> {
    try {
        const clearService = new FirestoreClearService();
        const [stats, estimate] = await Promise.all([
            clearService.getCollectionStats(),
            clearService.estimateClearTime(),
        ]);

        return {
            success: true,
            message: 'Success',
            data: { stats, estimate, timestamp: new Date().toISOString() },
        };
    } catch (error) {
        console.error('Get firestore stats error:', error);
        throw new Error(`Failed to get firestore stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function handlePopulateBootstrapData(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Populating bootstrap data...');

        const { FplFirestore } = await import('../../../_shared/lib/fpl/fpl-firestore');
        const firestore = new FplFirestore();
        const result = await firestore.preloadCommonData({
            includeBootstrap: true,
            includeEnhancedData: false,
            includeElementDetailedStats: false,
            forceRefresh: true,
        });

        return {
            success: true,
            message: `Bootstrap data populated! ${result.results.bootstrap?.elements?.length || 0} players loaded`,
            data: result,
        };
    } catch (error) {
        console.error('Populate bootstrap data error:', error);
        throw new Error(
            `Failed to populate bootstrap data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}

// EXACT COPY from "generateEnhancedDataFast" case
export async function handleGenerateEnhancedData(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Generating enhanced data (fast mode)...');

        const { FplFirestore } = await import('../../../_shared/lib/fpl/fpl-firestore');
        const firestore = new FplFirestore();
        const result = await firestore.preloadCommonData({
            includeBootstrap: false,
            includeEnhancedData: true,
            includeElementDetailedStats: false,
            forceRefresh: true,
        });

        return {
            success: true,
            message: `Enhanced data generated (fast)! ${
                result.results.enhanced?.length || 0
            } players with basic draft calculations`,
            data: result,
        };
    } catch (error) {
        console.error('Generate enhanced data (fast) error:', error);
        throw new Error(
            `Failed to generate enhanced data (fast): ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}

// EXACT COPY from "populateElementDetailedStats" case
export async function handlePopulateElementDetailedStats(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Populating element summaries...');

        const { FplFirestore } = await import('../../../_shared/lib/fpl/fpl-firestore');
        const firestore = new FplFirestore();
        const result = await firestore.preloadCommonData({
            includeBootstrap: false,
            includeEnhancedData: false,
            includeElementDetailedStats: true,
            forceRefresh: true,
        });

        return {
            success: true,
            message: `Element summaries populated! ${
                Object.keys(result.results.elementDetailedStats || {}).length
            } players with detailed stats`,
            data: result,
        };
    } catch (error) {
        console.error('Populate element summaries error:', error);
        throw new Error(
            `Failed to populate element summaries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}
