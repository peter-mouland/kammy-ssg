// app/admin/server/services/system-status.service.ts

import { getFirestoreInstance } from '../../../_shared/lib/firestore-cache/firebase.admin';
import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import { readDivisions } from '../../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../../_shared/lib/sheets/user-teams';
import type { SystemHealthStatus, SystemStatusSummary } from '../../types/admin-types';

/**
 * Get comprehensive system status with all real data
 */
export async function getSystemStatus(): Promise<SystemStatusSummary> {
    try {
        console.log('🔄 getSystemStatus() - Loading comprehensive system status');

        // Load all status data in parallel for better performance
        const [currentGameweek, fplCacheHealth, transferStatus, draftStatus, gameweekProcessingStatus] =
            await Promise.all([
                fplApiCache.getCurrentGameweek(),
                checkFplCacheHealth(),
                getTransferStatusReal(),
                getDraftStatusReal(),
                getGameweekProcessingStatusReal(),
            ]);

        // Check Firebase health
        const firebaseHealth = await checkFirebaseHealth();

        // Check Google Sheets health
        const googleSheetsHealth = await checkGoogleSheetsHealth();

        // Determine overall system health
        const overallHealth = determineOverallHealth([fplCacheHealth, firebaseHealth, googleSheetsHealth]);

        // Generate recommendations
        const recommendations = generateRecommendations({
            fplCacheHealth,
            firebaseHealth,
            googleSheetsHealth,
            transferStatus,
            draftStatus,
            gameweekProcessingStatus,
        });

        const summary: SystemStatusSummary = {
            currentGameweek,
            systemHealth: {
                fplCache: fplCacheHealth,
                firebase: firebaseHealth,
                googleSheets: googleSheetsHealth,
                overall: overallHealth,
            },
            transfers: transferStatus.overall,
            draft: {
                isActive: draftStatus.isActive,
                currentDivisionId: draftStatus.currentDivisionId,
                currentUserId: draftStatus.currentUserId,
                currentPick: draftStatus.currentPick,
                byDivision: draftStatus.byDivision,
            },
            gameweekProcessing: gameweekProcessingStatus,
            recommendations,
        };

        console.log(
            `✅ System Status Summary: GW${currentGameweek}, ${overallHealth.status.toUpperCase()}, ${recommendations.length} recommendations`,
        );

        return summary;
    } catch (error) {
        console.error('❌ getSystemStatus() failed:', error);

        // Return safe defaults on error
        return {
            currentGameweek: 1,
            systemHealth: {
                fplCache: { status: 'critical', message: 'Failed to load FPL cache status' },
                firebase: { status: 'critical', message: 'Failed to connect to Firebase' },
                googleSheets: { status: 'critical', message: 'Failed to connect to Google Sheets' },
                overall: { status: 'critical', message: 'System status check failed' },
            },
            transfers: { pending: 0, approved: 0, rejected: 0, total: 0, byDivision: {} },
            draft: { isActive: false, currentDivisionId: null, currentUserId: null, currentPick: null, byDivision: {} },
            gameweekProcessing: {
                currentGameweek: 1,
                lastProcessedGameweek: null,
                totalGameweeks: 38,
                processedGameweeks: [],
                pendingGameweeks: [],
                isUpToDate: false,
                completionPercentage: 0,
            },
            recommendations: ['System health check failed - please check logs'],
        };
    }
}

/**
 * Check FPL cache health
 */
async function checkFplCacheHealth(): Promise<SystemHealthStatus> {
    try {
        const cacheHealth = await fplApiCache.getCacheHealth();

        if (cacheHealth.health?.overall === 'healthy') {
            return { status: 'healthy', message: 'FPL cache is healthy' };
        } else if (cacheHealth.health?.overall === 'warning') {
            return {
                status: 'warning',
                message: `FPL cache has warnings: ${cacheHealth.health.issues?.join(', ') || 'Unknown issues'}`,
            };
        } else {
            return {
                status: 'critical',
                message: `FPL cache is critical: ${cacheHealth.health?.issues?.join(', ') || 'Unknown issues'}`,
            };
        }
    } catch (_error) {
        return { status: 'critical', message: 'Failed to check FPL cache health' };
    }
}

/**
 * Check Firebase health
 */
async function checkFirebaseHealth(): Promise<SystemHealthStatus> {
    try {
        const db = getFirestoreInstance();
        // Simple connectivity test
        await db.collection('test').limit(1).get();
        return { status: 'healthy', message: 'Firebase connection is healthy' };
    } catch (_error) {
        return { status: 'critical', message: 'Firebase connection failed' };
    }
}

/**
 * Check Google Sheets health
 */
async function checkGoogleSheetsHealth(): Promise<SystemHealthStatus> {
    try {
        const [divisions, userTeams] = await Promise.all([readDivisions(), readUserTeams()]);

        if (divisions.length > 0 && userTeams.length > 0) {
            return { status: 'healthy', message: 'Google Sheets connection is healthy' };
        } else {
            return { status: 'warning', message: 'Google Sheets connected but missing data' };
        }
    } catch (_error) {
        return { status: 'critical', message: 'Google Sheets connection failed' };
    }
}

/**
 * Get real transfer status using existing services
 */
async function getTransferStatusReal() {
    try {
        console.log('🔄 Loading (getTransferStatusReal) real transfer status...');

        // Use the existing transfer data service
        const { getTransfersDataForDivision } = await import(
            '../../../transfers/server/services/transfers-data.service'
        );

        // Get divisions and current gameweek context
        const [divisions, gameweekData] = await Promise.all([readDivisions(), fplApiCache.getFplEvents()]);
        const currentGameweek =
            gameweekData.find((gw) => gw.fplEvent.is_current) || gameweekData[gameweekData.length - 1];
        // Build the status structure
        const byDivision: Record<string, any> = {};
        let totalPending = 0;
        let totalApproved = 0;
        let totalRejected = 0;

        // Process each division
        for (const division of divisions) {
            try {
                const transfersData = await getTransfersDataForDivision(division.id, currentGameweek);

                const divisionStats = {
                    pending: transfersData.statusStats.pendingCount,
                    approved: transfersData.statusStats.approvedCount,
                    rejected: transfersData.statusStats.rejectedCount,
                    total:
                        transfersData.statusStats.pendingCount +
                        transfersData.statusStats.approvedCount +
                        transfersData.statusStats.rejectedCount,
                };

                byDivision[division.id] = divisionStats;

                totalPending += divisionStats.pending;
                totalApproved += divisionStats.approved;
                totalRejected += divisionStats.rejected;
            } catch (error) {
                console.warn(`Failed to get transfers for division ${division.id}:`, error);
                byDivision[division.id] = {
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    total: 0,
                };
            }
        }

        return {
            overall: {
                pending: totalPending,
                approved: totalApproved,
                rejected: totalRejected,
                total: totalPending + totalApproved + totalRejected,
                byDivision,
            },
        };
    } catch (error) {
        console.error('Failed to load transfer status:', error);
        return {
            overall: {
                pending: 0,
                approved: 0,
                rejected: 0,
                total: 0,
                byDivision: {},
            },
        };
    }
}

/**
 * Get real draft status using existing sheet functions
 */
async function getDraftStatusReal() {
    try {
        console.log('🔄 Loading real draft status...');

        const { readDraftState } = await import('../../../_shared/lib/sheets/draft');
        const draftState = await readDraftState();

        return {
            isActive: draftState?.isActive || false,
            currentDivisionId: draftState?.currentDivisionId || null,
            currentUserId: draftState?.currentUserId || null,
            currentPick: draftState?.currentPick || null,
            byDivision: {}, // TODO: Add division-specific draft status if needed
        };
    } catch (error) {
        console.error('Failed to load draft status:', error);
        return {
            isActive: false,
            currentDivisionId: null,
            currentUserId: null,
            currentPick: null,
            byDivision: {},
        };
    }
}

/**
 * Get real gameweek processing status using GameweekPointsService
 */
async function getGameweekProcessingStatusReal() {
    try {
        console.log('🔄 Loading real gameweek processing status...');

        // Use the GameweekPointsService which tracks actual point generation
        const { GameweekPointsService } = await import('../../../scoring/server/services/gameweek-points.service');
        const pointsService = new GameweekPointsService();
        const pointsStatus = await pointsService.getPointsStatus();

        const currentGameweek = pointsStatus.currentGameweek;
        const lastProcessedGameweek = pointsStatus.lastGameweek;

        // Calculate processed and pending gameweeks
        const processedGameweeks =
            lastProcessedGameweek > 0 ? Array.from({ length: lastProcessedGameweek }, (_, i) => i + 1) : [];

        const pendingGameweeks =
            currentGameweek > lastProcessedGameweek
                ? Array.from(
                      { length: currentGameweek - lastProcessedGameweek },
                      (_, i) => lastProcessedGameweek + i + 1,
                  )
                : [];

        const completionPercentage =
            currentGameweek > 0 ? Math.round((lastProcessedGameweek / currentGameweek) * 100) : 0;

        return {
            currentGameweek,
            lastProcessedGameweek,
            totalGameweeks: 38,
            processedGameweeks,
            pendingGameweeks,
            isUpToDate: currentGameweek === lastProcessedGameweek,
            completionPercentage,
        };
    } catch (error) {
        console.error('Failed to load gameweek processing status:', error);
        return {
            currentGameweek: 1,
            lastProcessedGameweek: null,
            totalGameweeks: 38,
            processedGameweeks: [],
            pendingGameweeks: [],
            isUpToDate: false,
            completionPercentage: 0,
        };
    }
}

/**
 * Determine overall system health from individual components
 */
function determineOverallHealth(healthStatuses: SystemHealthStatus[]): SystemHealthStatus {
    const criticalCount = healthStatuses.filter((h) => h.status === 'critical').length;
    const warningCount = healthStatuses.filter((h) => h.status === 'warning').length;

    if (criticalCount > 0) {
        return { status: 'critical', message: `${criticalCount} critical system issues detected` };
    } else if (warningCount > 0) {
        return { status: 'warning', message: `${warningCount} system warnings detected` };
    } else {
        return { status: 'healthy', message: 'All systems operational' };
    }
}

/**
 * Generate system recommendations based on current status
 */
function generateRecommendations(data: {
    fplCacheHealth: SystemHealthStatus;
    firebaseHealth: SystemHealthStatus;
    googleSheetsHealth: SystemHealthStatus;
    transferStatus: any;
    draftStatus: any;
    gameweekProcessingStatus: any;
}): string[] {
    const recommendations: string[] = [];

    // FPL Cache recommendations
    if (data.fplCacheHealth.status === 'critical') {
        recommendations.push('Run "Populate Bootstrap Data" to fix FPL cache issues');
    } else if (data.fplCacheHealth.status === 'warning') {
        recommendations.push('Run "Generate Enhanced Data" to resolve FPL cache warnings');
    }

    // Transfer recommendations
    if (data.transferStatus.overall.pending > 0) {
        recommendations.push(`${data.transferStatus.overall.pending} transfers pending review`);
    }

    // Draft recommendations
    if (data.draftStatus.isActive) {
        recommendations.push(`Draft is active in ${data.draftStatus.currentDivisionId} - sync to Firebase if needed`);
    }

    // Gameweek processing recommendations
    if (!data.gameweekProcessingStatus.isUpToDate) {
        const pendingCount = data.gameweekProcessingStatus.pendingGameweeks.length;
        recommendations.push(`${pendingCount} gameweek${pendingCount === 1 ? '' : 's'} need processing`);
    }

    // Firebase recommendations
    if (data.firebaseHealth.status === 'critical') {
        recommendations.push('Check Firebase connection and permissions');
    }

    // Google Sheets recommendations
    if (data.googleSheetsHealth.status === 'critical') {
        recommendations.push('Check Google Sheets API connection and permissions');
    }

    return recommendations;
}
