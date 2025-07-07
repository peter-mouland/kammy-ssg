// app/admin/server/actions/system-actions.ts

import type { AdminActionResult } from '../../types/admin-types';
import { getSystemStatus } from '../services/system-status.service';

/**
 * Handle getting comprehensive system status with real data
 * This replaces all the individual mock status calls
 */
export async function handleGetSystemStatus(): Promise<AdminActionResult> {
    try {
        console.log('🔄 handleGetSystemStatus() - Getting comprehensive system status');

        const systemStatus = await getSystemStatus();

        return {
            success: true,
            message: 'System status loaded successfully',
            data: systemStatus,
        };
    } catch (error) {
        console.error('❌ handleGetSystemStatus() failed:', error);

        return {
            success: false,
            error: 'Failed to get system status',
            message: error instanceof Error ? error.message : 'Failed to get system status',
        };
    }
}

/**
 * Handle test action for debugging
 */
export async function handleTestAction(): Promise<AdminActionResult> {
    try {
        console.log('🧪 handleTestAction() - Test action triggered');

        return {
            success: true,
            message: 'Test action completed successfully',
            data: {
                timestamp: new Date().toISOString(),
                status: 'working',
            },
        };
    } catch (error) {
        console.error('❌ handleTestAction() failed:', error);

        return {
            success: false,
            error: 'Test action failed',
            message: error instanceof Error ? error.message : 'Test action failed',
        };
    }
}

/**
 * Handle system health check action
 */
export async function handleSystemHealthCheck(): Promise<AdminActionResult> {
    try {
        console.log('🔄 handleSystemHealthCheck() - Running comprehensive health check');

        const systemStatus = await getSystemStatus();

        // Generate detailed health report in the format expected by the UI
        const healthReport = {
            overallStatus: systemStatus.systemHealth.overall.status,
            overallMessage: systemStatus.systemHealth.overall.message,
            components: {
                fplCache: {
                    status: systemStatus.systemHealth.fplCache.status,
                    message: systemStatus.systemHealth.fplCache.message,
                },
                firebase: {
                    status: systemStatus.systemHealth.firebase.status,
                    message: systemStatus.systemHealth.firebase.message,
                },
                googleSheets: {
                    status: systemStatus.systemHealth.googleSheets.status,
                    message: systemStatus.systemHealth.googleSheets.message,
                },
            },
            summary: {
                currentGameweek: systemStatus.currentGameweek,
                pendingTransfers: systemStatus.transfers.pending,
                activeDrafts: systemStatus.draft.isActive ? 1 : 0,
                gameweekProcessingStatus: systemStatus.gameweekProcessing.isUpToDate ? 'up-to-date' : 'behind',
                recommendations: systemStatus.recommendations,
            },
        };

        const isHealthy = systemStatus.systemHealth.overall.status === 'healthy';

        return {
            success: true,
            message: isHealthy
                ? 'System health check passed - all systems operational'
                : `System health check completed - ${systemStatus.systemHealth.overall.message}`,
            data: healthReport,
        };
    } catch (error) {
        console.error('❌ handleSystemHealthCheck() failed:', error);

        return {
            success: false,
            error: 'System health check failed',
            message: error instanceof Error ? error.message : 'System health check failed',
        };
    }
}

/**
 * IMPROVED version of "getCacheStatus" to provide better data structure
 * This maintains backward compatibility with existing UI components
 */
export async function handleGetCacheStatus(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Getting cache status using real system data...');

        // Get comprehensive system status
        const systemStatus = await getSystemStatus();

        // Also get the original FPL cache health for detailed cache info
        const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');
        const fplCacheHealth = await fplApiCache.getCacheHealth();

        // Combine real system status with detailed cache information
        const enhancedCacheData = {
            ...fplCacheHealth,
            // Add our real system health indicators
            systemHealth: {
                overall: systemStatus.systemHealth.overall.status,
                fplCache: systemStatus.systemHealth.fplCache.status,
                firebase: systemStatus.systemHealth.firebase.status,
                googleSheets: systemStatus.systemHealth.googleSheets.status,
            },
            // Add real transfer and draft status
            additionalStatus: {
                pendingTransfers: systemStatus.transfers.pending,
                draftActive: systemStatus.draft.isActive,
                gameweekUpToDate: systemStatus.gameweekProcessing.isUpToDate,
                recommendations: systemStatus.recommendations,
            },
        };

        return {
            success: true,
            message: `Cache status retrieved - ${systemStatus.systemHealth.fplCache.status} (Enhanced with real system data)`,
            data: enhancedCacheData,
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
                    elementDetailedStats: 0,
                },
                missing: {
                    teams: true,
                    events: true,
                    elements: true,
                    elementDetailedStats: true,
                },
            },
        };
    }
}
