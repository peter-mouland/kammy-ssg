// app/admin/server/services/system-status.service.ts

import { getFirestoreInstance } from '../../../_shared/lib/firestore-cache/firebase.admin';
import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import type { GameWeekData } from '../../../_shared/lib/fpl/fpl-types';
import { groupByDivision } from '../../../_shared/lib/group-by-id';
import { readDivisions } from '../../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../../_shared/lib/sheets/user-teams';
import type { DraftStatusByDivisionId, DraftStatusData } from '../../../draft/types/draft-types';
import { divisionDocumentExists } from '../../../scoring/server/services/division-teams.service';
import type { FplCacheHealth, HealthLevel, SystemHealthStatus, SystemStatusSummary } from '../../types/admin-types';

/** Reported when the FPL cache status could not be read at all. */
const FPL_CACHE_HEALTH_UNKNOWN: FplCacheHealth = {
    status: 'critical',
    data: {
        completionPercentage: 0,
        counts: { elements: 0, events: 0, teams: 0, elementDetailedStats: 0 },
        missing: { elements: true, events: true, teams: true, elementDetailedStats: true, draftData: true },
    },
};

/** Reported when the draft status could not be derived. */
const DRAFT_STATUS_UNKNOWN: DraftStatusData = {
    stage: 'unknown',
    isComplete: false,
    isActive: false,
    divisionId: null,
    currentUserId: null,
    currentPick: null,
    totalPicks: 0,
    startedAt: null,
    completedAt: null,
    picksPerTeam: 0,
    byDivision: {},
};

/**
 * Get comprehensive system status with all real data
 */
export async function getSystemStatus(): Promise<SystemStatusSummary> {
    try {
        console.log('🔄 getSystemStatus() - Loading comprehensive system status');

        // Load all status data in parallel for better performance
        const [transferStatus, draftStatus, gameweekProcessingStatus, bootstrapLastUpdated] = await Promise.all([
            getTransferStatusReal(),
            getDraftStatusReal(),
            getGameweekProcessingStatusReal(),
            getBootstrapLastUpdated(),
        ]);

        const fplHealth = await fplApiCache.getCacheHealth();

        // Check Firebase health
        const firebaseHealth = await checkFirebaseHealth();

        // Check Google Sheets health
        const googleSheetsHealth = await checkGoogleSheetsHealth();

        // Determine overall system health
        const overallHealth = determineOverallHealth([fplHealth, firebaseHealth, googleSheetsHealth]);

        // Generate recommendations
        const recommendations = generateRecommendations({
            fplHealth,
            firebaseHealth,
            googleSheetsHealth,
            transferStatus,
            draftStatus,
            gameweekProcessingStatus,
        });

        const summary: SystemStatusSummary = {
            currentGameweek: gameweekProcessingStatus.currentGameweek,
            bootstrapLastUpdated,
            systemHealth: {
                fplCache: fplHealth,
                firebase: firebaseHealth,
                googleSheets: googleSheetsHealth,
                overall: overallHealth,
            },
            transfers: transferStatus.overall,
            draft: draftStatus,
            gameweekProcessing: gameweekProcessingStatus,
            recommendations,
        };

        console.log(
            `✅ System Status Summary: GW${gameweekProcessingStatus.currentGameweek.fplEvent.id}, ${overallHealth.status.toUpperCase()}, ${recommendations.length} recommendations`,
        );

        return summary;
    } catch (error) {
        console.error('❌ getSystemStatus() failed:', error);

        // Return safe defaults on error
        return {
            currentGameweek: { fplEvent: { id: 1 } } as GameWeekData,
            bootstrapLastUpdated: null,
            systemHealth: {
                fplCache: FPL_CACHE_HEALTH_UNKNOWN,
                firebase: { status: 'critical', message: 'Failed to connect to Firebase' },
                googleSheets: { status: 'critical', message: 'Failed to connect to Google Sheets' },
                overall: { status: 'critical', message: 'System status check failed' },
            },
            transfers: { pending: 0, approved: 0, rejected: 0, total: 0, byDivision: {} },
            draft: DRAFT_STATUS_UNKNOWN,
            gameweekProcessing: {
                currentGameweek: { fplEvent: { id: 1 } } as GameWeekData,
                lastProcessedGameweek: 0,
                totalGameweeks: 38,
                processedGameweeks: [],
                pendingGameweeks: [],
                isUpToDate: false,
                needsProcessing: true,
                completionPercentage: 0,
                lastProcessedAt: null,
            },
            recommendations: ['System health check failed - please check logs'],
        };
    }
}

/**
 * Get bootstrap last updated timestamp
 */
async function getBootstrapLastUpdated(): Promise<string | null> {
    try {
        const db = getFirestoreInstance();
        const elementsDoc = await db.collection('fpl-bootstrap').doc('elements').get();

        if (elementsDoc.exists) {
            const data = elementsDoc.data();
            return data?.lastUpdated || null;
        }

        return null;
    } catch (error) {
        console.error('❌ Failed to get bootstrap lastUpdated:', error);
        return null;
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
async function getDraftStatusReal(): Promise<SystemStatusSummary['draft']> {
    try {
        console.log('🔄 Loading real draft status...');

        const { readDivisions } = await import('../../../_shared/lib/sheets/divisions');
        const { readDraftState, readDraftPicks } = await import('../../../_shared/lib/sheets/draft');
        const { draftOrderExists } = await import('../../../_shared/lib/sheets/draft-order');
        const userTeams = await readUserTeams();
        const divisionSheetData = await readDivisions();
        const draftState = await readDraftState();
        const draftPicks = await readDraftPicks();

        const byDivisionId: DraftStatusByDivisionId = {};
        const totalPicks = userTeams.length * draftState.picksPerTeam;
        let hasOutstandingCommits = false;
        let hasOutstandingOrders = false;
        const divisionPicks = groupByDivision(divisionSheetData, draftPicks);
        const promises = divisionSheetData.map(async (division) => {
            const committed = await divisionDocumentExists(division.id, 0);
            const doesDraftOrderExists = await draftOrderExists(division.id);

            hasOutstandingCommits = hasOutstandingCommits && !committed;
            hasOutstandingOrders = hasOutstandingOrders && !doesDraftOrderExists;
            byDivisionId[division.id] = {
                doesDraftOrderExists,
                pickCount: divisionPicks[division.id].length,
                picksRemaining: totalPicks - divisionPicks[division.id].length,
                isCommitted: committed,
            };
        });

        await Promise.all(promises);

        const isRunning = draftState?.isActive && draftState.currentPick < totalPicks;

        return {
            // daft order | start draft | draft running | stop draft | commit drafts | draft complete
            stage: hasOutstandingOrders
                ? 'order'
                : draftState?.startedAt
                  ? isRunning
                      ? 'running'
                      : draftState?.completedAt
                        ? hasOutstandingCommits
                            ? 'commit'
                            : 'complete'
                        : 'stop'
                  : 'start',
            isComplete: !hasOutstandingCommits,
            isActive: draftState?.isActive || false,
            divisionId: draftState?.divisionId || null,
            currentUserId: draftState?.currentUserId || null,
            currentPick: draftState?.currentPick || null,
            totalPicks,
            startedAt: draftState?.startedAt || null,
            completedAt: draftState?.completedAt || null,
            picksPerTeam: draftState?.picksPerTeam || 12,
            byDivision: byDivisionId,
        };
    } catch (error) {
        console.error('Failed to load draft status:', error);
        return DRAFT_STATUS_UNKNOWN;
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
        const pointsService = new GameweekPointsService(); // todo: pass in context
        const pointsStatus = await pointsService.getPointsStatus();

        const currentGameweekId = pointsStatus.currentGameweek.fplEvent.id;
        const lastProcessedGameweek = pointsStatus.lastGameweek;

        // Calculate processed and pending gameweeks
        const processedGameweeks =
            lastProcessedGameweek > 0 ? Array.from({ length: lastProcessedGameweek }, (_, i) => i + 1) : [];

        const pendingGameweeks =
            currentGameweekId > lastProcessedGameweek
                ? Array.from(
                      { length: currentGameweekId - lastProcessedGameweek },
                      (_, i) => lastProcessedGameweek + i + 1,
                  )
                : [];

        const completionPercentage =
            currentGameweekId > 0 ? Math.round((lastProcessedGameweek / currentGameweekId) * 100) : 0;

        return {
            currentGameweek: pointsStatus.currentGameweek,
            lastProcessedGameweek,
            totalGameweeks: 38,
            processedGameweeks,
            pendingGameweeks,
            isUpToDate: currentGameweekId === lastProcessedGameweek,
            needsProcessing: currentGameweekId > lastProcessedGameweek,
            completionPercentage,
            lastProcessedAt: null, // todo
        };
    } catch (error) {
        console.error('Failed to load gameweek processing status:', error);
        return {
            currentGameweek: { fplEvent: { id: 1 } } as GameWeekData,
            lastProcessedGameweek: 0,
            totalGameweeks: 38,
            processedGameweeks: [],
            pendingGameweeks: [],
            isUpToDate: false,
            needsProcessing: true,
            completionPercentage: 0,
            lastProcessedAt: null, // todo
        };
    }
}

/**
 * Determine overall system health from individual components
 */
function determineOverallHealth(healthStatuses: Array<{ status: HealthLevel }>): SystemHealthStatus {
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
function generateRecommendations({
    fplHealth,
    firebaseHealth,
    googleSheetsHealth,
    transferStatus,
    draftStatus,
    gameweekProcessingStatus,
}: {
    fplHealth: FplCacheHealth;
    firebaseHealth: SystemHealthStatus;
    googleSheetsHealth: SystemHealthStatus;
    transferStatus: any;
    draftStatus: DraftStatusData;
    gameweekProcessingStatus: any;
}): string[] {
    const recommendations: string[] = [];
    const issues: string[] = [];

    // Check for critical issues
    if (fplHealth.data.missing.elements || fplHealth.data.missing.teams || fplHealth.data.missing.events) {
        issues.push('Missing core FPL data (teams/events)');
        recommendations.push('Run "Populate Bootstrap Data" to fetch core FPL data');
    }

    // draft
    if (draftStatus.stage !== 'complete') {
        if (draftStatus.stage === 'order') recommendations.push('Need to generate the draft order');
        if (draftStatus.stage === 'start') recommendations.push('The "Draft Day" needs running');
        if (draftStatus.stage === 'stop') recommendations.push('Draft is complete, stop it');
        if (draftStatus.stage === 'commit') recommendations.push('Save the draft to the db (commit)');
    }

    // Transfer recommendations
    if (transferStatus.overall.pending > 0) {
        issues.push(`${transferStatus.overall.pending} transfers pending review`);
        recommendations.push('Approve / Reject transfers');
    }

    // Gameweek processing recommendations
    if (!gameweekProcessingStatus.isUpToDate) {
        const pendingCount = gameweekProcessingStatus.pendingGameweeks.length;
        issues.push('GameWeek data is out of date');
        recommendations.push(`${pendingCount} gameweek${pendingCount === 1 ? '' : 's'} need processing`);
    }

    return recommendations;
}
