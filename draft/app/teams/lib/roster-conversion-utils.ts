// app/_shared/lib/roster-conversion-utils.ts

import type { PositionSlotKey } from '../../_shared/types/league-types';
import type { PlayerGameweekStatsData } from '../../players/types/player-types';
import type { Points } from '../../scoring/types/scoring-types';
import type { LoanStatus, RosterPlayer, TeamPositionSlot, TeamRoster } from '../types/team-types';
import { getNextAvailableSlot, parsePositionSlot } from './position-slot-utils';

/**
 * Convert legacy FirestoreTeamMember array to new roster structure
 */
export function convertLegacyPlayersToRoster(legacyPlayers: any[]): TeamRoster {
    const roster: TeamRoster = {} as TeamRoster;

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

        if (!player.playerId || Number.isNaN(Number(player.playerId))) {
            throw new Error(`Invalid playerId for ${player.player} (code: ${player.playerCode}) in slot ${slot}`);
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
export function extractLoanStatus(roster: TeamRoster, currentUserId: string): LoanStatus {
    const loanedOut: RosterPlayer[] = [];
    const loanedIn: RosterPlayer[] = [];

    for (const positionSlot of Object.values(roster)) {
        if (positionSlot?.player.onLoanFrom === currentUserId) {
            loanedIn.push(positionSlot.player);
        }
    }
    if (roster.on_loan_0?.player) {
        loanedOut.push(roster.on_loan_0?.player);
    }

    return { loanedOut, loanedIn };
}

/**
 * Calculate total points for roster
 */
export function calculateRosterTotalPoints(roster: TeamRoster, useSeasonPoints: boolean = true): number {
    let total = 0;

    for (const positionSlot of Object.values(roster)) {
        if (positionSlot?.season?.points && positionSlot?.gameweek?.points) {
            const points = useSeasonPoints ? positionSlot.season.points : positionSlot.gameweek.points;
            total += points.total;
        }
    }

    return total;
}

/**
 * Get top scorer from roster
 */
export function getRosterTopScorer(
    roster: TeamRoster,
    useSeasonPoints: boolean = true,
): { slot: PositionSlotKey; player: TeamPositionSlot; points: number } | null {
    let topScorer: { slot: PositionSlotKey; player: TeamPositionSlot; points: number } | null = null;

    for (const [sotKey, positionSlot] of Object.entries(roster)) {
        if (!positionSlot.season) {
            console.log(`🚨 no points for ${sotKey}`);
        }
        const points = useSeasonPoints ? positionSlot.season?.points.total : positionSlot.gameweek?.points.total;

        if (!topScorer || points > topScorer.points) {
            topScorer = {
                slot: sotKey as PositionSlotKey,
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
export function createEmptyStats(): PlayerGameweekStatsData {
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
        defensiveContribution: 0,
        clearancesBlocksInterceptions: 0,
        tackles: 0,
        recoveries: 0,
        bonus: 0,
    };
}

/**
 * Create empty points structure
 */
export function createEmptyPoints(): Points {
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
        defensiveContribution: 0,
        total: 0,
    };
}
