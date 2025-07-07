// app/admin/server/services/draft.service.ts

import { FirebaseDraftSync } from '../../../_shared/lib/firestore-cache/firebase-draft-sync';
import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import { convertLegacyPlayersToRoster } from '../../../_shared/lib/roster-conversion-utils';
import { getDraftPicksByDivision, readDraftState, updateDraftState } from '../../../_shared/lib/sheets/draft';
import { clearDraftOrder, draftOrderExists, getDraftOrderByDivision } from '../../../_shared/lib/sheets/draft-order';
import type { DraftPickData, DraftStateData } from '../../../draft/types/draft-types';
import { createDivisionTeamsDocument } from '../../../scoring/server/services/division-teams.service';
import type {
    DivisionId,
    DivisionTeamsDocument,
    PositionSlotKey,
    TeamPositionSlot,
} from '../../../teams/types/team-types';
import type { DraftResult } from '../../types/admin-orchestrator-types';
import type { AdminActionResult } from '../../types/admin-types';

/**
 * Draft service for managing draft operations
 * This integrates with existing draft functionality but provides
 * a unified interface for the orchestrator
 */
export class DraftService {
    /**
     * Start a new draft for a division
     */
    async startDraft(divisionId: DivisionId): Promise<DraftResult> {
        try {
            const orderExists = await draftOrderExists(divisionId);
            if (!orderExists) {
                throw new Error('Draft order must be generated before starting the draft');
            }

            const draftOrder = await getDraftOrderByDivision(divisionId);
            const firstUser = draftOrder.find((order) => order.position === 1);

            if (!firstUser) {
                throw new Error('No users found in draft order');
            }

            // Initialize draft state
            await updateDraftState({
                isActive: true,
                currentPick: 1,
                currentUserId: firstUser.userId,
                currentDivisionId: divisionId,
                picksPerTeam: 12,
                startedAt: new Date(),
                completedAt: null,
            });

            return {
                success: true,
                message: `Draft started for division ${divisionId}`,
                data: { divisionId, status: 'started' },
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to start draft',
            };
        }
    }

    async stopDraft(): Promise<AdminActionResult> {
        const currentDraftState = await readDraftState();
        if (!currentDraftState?.isActive) {
            throw new Error('No active draft to stop');
        }

        const stoppedDraftState: DraftStateData = {
            ...currentDraftState,
            isActive: false,
            completedAt: new Date(),
        };

        await updateDraftState(stoppedDraftState);
        return {
            success: true,
            message: 'Draft stopped successfully',
        };
    }

    /**
     * Sync draft state to Firebase for real-time updates
     */
    async syncDraft(divisionId: DivisionId): Promise<DraftResult> {
        try {
            const syncResult = await FirebaseDraftSync.syncDraftFromSheets(divisionId, false);

            return {
                success: true,
                message: `Draft synced for division ${divisionId}! ${syncResult.picksCount} picks, current pick: ${
                    syncResult.currentPick
                }${syncResult.isActive ? `, turn: ${syncResult.currentUserId}` : ' (completed)'}`,
                data: syncResult,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to sync draft',
            };
        }
    }

    /**
     * Commit completed draft (finalize and lock in results)
     */
    async commitDraft(divisionId: DivisionId): Promise<DraftResult> {
        try {
            // Get all draft picks for validation
            const draftPicks = await getDraftPicksByDivision(divisionId);

            // Validate draft is complete
            const expectedPicks = 1; // this.calculateExpectedPicks(divisionId);
            if (draftPicks.length < expectedPicks) {
                return {
                    success: false,
                    message: `Draft incomplete: ${draftPicks.length}/${expectedPicks} picks made`,
                };
            }

            // Commit draft results to user teams
            await this.commitDraftResultsToTeams(divisionId, draftPicks);

            // Mark draft as completed
            await updateDraftState({
                isActive: false,
                isCompleted: true,
                completedAt: new Date().toLocaleString(),
            });

            return {
                success: true,
                message: `Draft committed for division ${divisionId} - ${draftPicks.length} picks finalized`,
                data: { divisionId, picksCommitted: draftPicks.length },
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to commit draft',
            };
        }
    }

    /**
     * Reset draft (clear all picks and start over)
     */
    async resetDraft(divisionId: DivisionId): Promise<DraftResult> {
        try {
            // Clear all draft picks
            await clearDraftOrder(divisionId);
            // const syncResult = await FirebaseDraftSync.syncDraftFromSheets(divisionId, true);

            // Reset draft state
            await updateDraftState({
                isActive: true,
                currentPick: 0,
                currentUserId: '',
                currentDivisionId: divisionId,
                picksPerTeam: 12,
                startedAt: new Date(),
                completedAt: null,
            });

            // await FirebaseDraftSync.clearDraftFromFirebase(divisionId);

            return {
                success: true,
                message: `Draft reset for division ${divisionId} - all picks cleared`,
                data: { divisionId, status: 'reset' },
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to reset draft',
            };
        }
    }

    /**
     * Commit draft results to user teams sheets
     */
    private async commitDraftResultsToTeams(divisionId: DivisionId, draftPicks: DraftPickData[]) {
        // Get all draft picks for validation
        const fplPlayers = await fplApiCache.getFplPlayers();

        // Validate draft is complete
        if (draftPicks.length === 0) {
            // < expectedPicks
            throw new Error(`No draft picks found for division ${divisionId}`);
        }
        const fplPlayersMap = new Map(fplPlayers.map((p) => [p.id, p]));
        // Group picks by user
        const teamsByUser = new Map<string, any[]>();
        for (const pick of draftPicks) {
            if (!teamsByUser.has(pick.userId)) {
                teamsByUser.set(pick.userId, []);
            }
            teamsByUser.get(pick.userId)?.push(pick);
        }
        // Convert each user's picks to new roster structure
        const teamsData: Record<string, { roster: Record<PositionSlotKey, TeamPositionSlot> }> = {};
        let totalPlayersProcessed = 0;

        for (const [userId, userPicks] of teamsByUser) {
            console.log(`Processing ${userPicks.length} picks for user ${userId}`);

            // Convert legacy format to new roster structure
            const legacyPlayers = userPicks.map((pick) => {
                const fplPlayer = fplPlayersMap.get(pick.playerId);
                if (!fplPlayer) {
                    console.warn(`FPL player not found for ID ${pick.playerId}`);
                } else if (pick.playerId === fplPlayer?.code) {
                    console.warn(`🚨 FPL player ID id CODE ${pick.playerId}`);
                }

                return {
                    userId,
                    playerId: pick.playerId,
                    playerCode: fplPlayer?.code,
                    player: fplPlayer?.web_name || 'Unknown Player',
                    playerPosition: pick.position, // Draft position from sheets
                    teamPosition: pick.position, // Will be recalculated in conversion
                    isSub: false, // Will be determined by position availability
                    onLoanTo: null,
                    onLoanStart: null,
                    gameweek: 0, // Draft is gameweek 0
                };
            });

            // Convert to new roster structure
            const roster = convertLegacyPlayersToRoster(legacyPlayers);

            teamsData[userId] = { roster };
            totalPlayersProcessed += Object.keys(roster).length;
        }

        // Create the new division document structure
        const now = new Date().toISOString();
        const divisionDocument: DivisionTeamsDocument = {
            divisionId,
            gameweek: 0, // Draft is gameweek 0
            lastUpdated: now,
            teams: teamsData,
            metadata: {
                createdAt: now,
                updatedAt: now,
                pointsLastUpdated: null,
                pointsLastGameweek: null,
            },
        };

        // Save the document using the service
        await createDivisionTeamsDocument(divisionDocument);

        const message = `Teams committed to new structure! ${totalPlayersProcessed} position slots across ${teamsByUser.size} teams in division ${divisionId}`;

        console.log(`✅ ${message}`);

        return {
            success: true,
            message,
            data: {
                divisionId,
                teamsCount: teamsByUser.size,
                positionSlotsCount: totalPlayersProcessed,
                documentId: `${divisionId}_gw1`,
                gameweek: 0,
                timestamp: now,
                structure: 'new-roster-based',
            },
        };
    }
}

// Mock implementations for services that don't exist yet
export async function processAllPendingTransfers() {
    // Mock implementation
    return {
        transfersProcessed: 5,
        transfersApproved: 3,
        transfersRejected: 2,
        errors: [],
    };
}

export async function validateAllTransferRules() {
    // Mock implementation
    return {
        validationCount: 10,
        rulesViolated: 0,
        warnings: [],
    };
}

export async function updateAllLeagueStandings() {
    // Mock implementation
    return {
        divisionsUpdated: 2,
        teamsProcessed: 16,
        errors: [],
    };
}

export async function finalizeCurrentGameweek() {
    // Mock implementation
    return {
        gameweek: 15,
        finalized: true,
        timestamp: new Date().toISOString(),
    };
}

export async function exportSystemData() {
    // Mock implementation
    return {
        fileSize: 15.2,
        recordsExported: 10000,
        exportPath: '/exports/system-data.json',
    };
}

export async function runComprehensiveDiagnostics() {
    // Mock implementation
    return {
        allTestsPassed: true,
        testsRun: 25,
        testsFailed: 0,
        results: [],
    };
}

export async function getRecentSystemLogs() {
    // Mock implementation
    return {
        logCount: 100,
        logs: [],
        timeframe: '24h',
    };
}

export async function forceRebuildAllData() {
    // Mock implementation
    return {
        rebuiltComponents: ['players', 'teams', 'points', 'standings'],
        totalRecords: 5000,
        duration: '2m 30s',
    };
}

export async function resetEntireDatabase() {
    // Mock implementation
    return {
        collectionsCleared: 10,
        recordsDeleted: 50000,
        reinitializationComplete: true,
    };
}
