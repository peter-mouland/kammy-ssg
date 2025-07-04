// app/_shared/lib/roster-conversion-utils.ts

import type { PlayerGameweekStatsData } from '../../players/types/player-types';
import type { Points } from '../../scoring/types/scoring-types';
import type { LoanStatus, PositionSlotKey, RosterPlayer, TeamPositionSlot } from '../../teams/types/team-types';
import { getNextAvailableSlot, parsePositionSlot, STARTING_XI_SLOTS } from './position-slot-utils';

/**
 * Convert legacy FirestoreTeamMember array to new roster structure
 */
export function convertLegacyPlayersToRoster(legacyPlayers: any[]): Record<PositionSlotKey, TeamPositionSlot> {
    const roster: Record<PositionSlotKey, TeamPositionSlot> = {} as Record<PositionSlotKey, TeamPositionSlot>;

    // Sort players by position priority and sub status
    const sortedPlayers = legacyPlayers.sort((a, b) => {
        // Subs go last
        if (a.isSub !== b.isSub) return a.isSub ? 1 : -1;

        // Position priority within non-subs
        const positionOrder = ['gk', 'cb', 'fb', 'mid', 'wa', 'ca'];
        return positionOrder.indexOf(a.playerPosition) - positionOrder.indexOf(b.playerPosition);
    });

    for (const player of sortedPlayers) {
        const slot = getNextAvailableSlot(player.playerPosition.toLowerCase(), roster);
        if (!slot) {
            console.warn(`No available slot for player ${player.player} (${player.playerPosition})`);
            continue;
        }

        const { position, index } = parsePositionSlot(slot);

        roster[slot] = {
            player: {
                playerId: Number.parseInt(player.playerId, 10),
                playerCode: player.playerCode,
                playerName: player.player,
                playerPosition: player.playerPosition.toLowerCase(),
                teamPosition: position === 'sub' ? 'sub' : (position as any),
                teamSlotIndex: index,
                isSub: player.isSub || position === 'sub',
                onLoanFrom: player.onLoanFrom,
                onLoanTo: player.onLoanTo,
                onLoanStart: player.onLoanStart,
                assignedAt: new Date().toISOString(), // Use current time as fallback
            },
            gameweek: {
                stats: createEmptyStats(),
                points: createEmptyPoints(),
            },
            season: {
                seasonGeneratedOn: '',
                seasonUpToGameweek: 0,
                stats: createEmptyStats(),
                points: createEmptyPoints(),
            },
        };
    }

    return roster;
}

/**
 * Extract loan status from roster
 */
export function extractLoanStatus(
    roster: Record<PositionSlotKey, TeamPositionSlot>,
    currentUserId: string,
): LoanStatus {
    const loanedOut: RosterPlayer[] = [];
    const loanedIn: RosterPlayer[] = [];

    for (const positionSlot of Object.values(roster)) {
        if (positionSlot.player.onLoanTo) {
            if (positionSlot.player.onLoanTo === currentUserId) {
                loanedIn.push(positionSlot.player);
            } else {
                loanedOut.push(positionSlot.player);
            }
        }
    }

    return { loanedOut, loanedIn };
}

/**
 * Get substitute players from roster
 */
export function getSubstitutePlayers(roster: Record<PositionSlotKey, TeamPositionSlot>): TeamPositionSlot[] {
    const substitutes: TeamPositionSlot[] = [];

    for (const [slot, positionSlot] of Object.entries(roster)) {
        const { isSub } = parsePositionSlot(slot as PositionSlotKey);
        if (isSub) {
            substitutes.push(positionSlot);
        }
    }

    return substitutes;
}

/**
 * Get starting XI players from roster
 */
export function getStartingXIPlayers(roster: Record<PositionSlotKey, TeamPositionSlot>): TeamPositionSlot[] {
    const startingXI: TeamPositionSlot[] = [];

    for (const slot of STARTING_XI_SLOTS) {
        if (roster[slot]) {
            startingXI.push(roster[slot]);
        }
    }

    return startingXI;
}

/**
 * Calculate total points for roster
 */
export function calculateRosterTotalPoints(
    roster: Record<PositionSlotKey, TeamPositionSlot>,
    useSeasonPoints: boolean = true,
): number {
    let total = 0;

    for (const positionSlot of Object.values(roster)) {
        const points = useSeasonPoints ? positionSlot.season.points : positionSlot.gameweek.points;
        total += points.total;
    }

    return total;
}

/**
 * Get top scorer from roster
 */
export function getRosterTopScorer(
    roster: Record<PositionSlotKey, TeamPositionSlot>,
    useSeasonPoints: boolean = true,
): { slot: PositionSlotKey; player: TeamPositionSlot; points: number } | null {
    let topScorer: { slot: PositionSlotKey; player: TeamPositionSlot; points: number } | null = null;

    for (const [slot, positionSlot] of Object.entries(roster)) {
        const points = useSeasonPoints ? positionSlot.season.points.total : positionSlot.gameweek.points.total;

        if (!topScorer || points > topScorer.points) {
            topScorer = {
                slot: slot as PositionSlotKey,
                player: positionSlot,
                points,
            };
        }
    }

    return topScorer;
}

/**
 * Create empty stats structure
 */
function createEmptyStats(): PlayerGameweekStatsData {
    return {
        appearance: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        goalsConceded: 0,
        penaltiesSaved: 0,
        yellowCards: 0,
        redCards: 0,
        saves: 0,
        bonus: 0,
    };
}

/**
 * Create empty points structure
 */
function createEmptyPoints(): Points {
    return {
        appearance: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        saves: 0,
        penaltiesSaved: 0,
        goalsConceded: 0,
        bonus: 0,
        total: 0,
    };
}
