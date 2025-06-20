// app/_shared/lib/roster-conversion-utils.ts
import type {
    TeamFormation,
    LoanStatus,
    PositionSlotKey,
    TeamPositionSlot,
    PlayerAssignmentData,
} from '../../teams/types/team-types';
import { getFormationSlots, parsePositionSlot, getNextAvailableSlot, STARTING_XI_SLOTS } from './position-slot-utils';
import type { PlayerGameweekStatsData, PointsBreakdown } from '../../scoring/types/scoring-types';

/**
 * Convert legacy FirestoreTeamMember array to new roster structure
 */
export function convertLegacyPlayersToRoster(
    legacyPlayers: any[],
    gameweek: number = 0,
): Record<PositionSlotKey, TeamPositionSlot> {
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
                playerPosition: player.playerPosition,
                teamPosition: position === 'sub' ? 'sub' : (position as any),
                teamSlotIndex: index,
                isSub: player.isSub || position === 'sub',
                onLoanTo: player.onLoanTo,
                onLoanStart: player.onLoanStart,
                assignedAt: new Date().toISOString(), // Use current time as fallback
            },
            gameweek: {
                stats: createEmptyStats(),
                points: createEmptyPoints(),
            },
            season: {
                stats: createEmptyStats(),
                points: createEmptyPoints(),
            },
        };
    }

    return roster;
}

/**
 * Convert roster to formation structure for display components
 */
export function convertRosterToFormation(roster: Record<PositionSlotKey, TeamPositionSlot>): TeamFormation {
    const formation: TeamFormation = {
        goalkeeper: [],
        centrebacks: [],
        fullbacks: [],
        midfielders: [],
        wideattackers: [],
        centralattackers: [],
    };

    const slots = getFormationSlots();

    // Map each position group
    formation.goalkeeper = slots.goalkeeper.map((slot) => roster[slot]).filter(Boolean);

    formation.centrebacks = slots.centrebacks.map((slot) => roster[slot]).filter(Boolean);

    formation.fullbacks = slots.fullbacks.map((slot) => roster[slot]).filter(Boolean);

    formation.midfielders = slots.midfielders.map((slot) => roster[slot]).filter(Boolean);

    formation.wideattackers = slots.wideAttackers.map((slot) => roster[slot]).filter(Boolean);

    formation.centralattackers = slots.centralAttackers.map((slot) => roster[slot]).filter(Boolean);

    return formation;
}

/**
 * Extract loan status from roster
 */
export function extractLoanStatus(
    roster: Record<PositionSlotKey, TeamPositionSlot>,
    currentUserId: string,
): LoanStatus {
    const loanedOut: TeamPositionSlot[] = [];
    const loanedIn: TeamPositionSlot[] = [];

    for (const positionSlot of Object.values(roster)) {
        if (positionSlot.player.onLoanTo) {
            if (positionSlot.player.onLoanTo === currentUserId) {
                loanedIn.push(positionSlot);
            } else {
                loanedOut.push(positionSlot);
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
 * Create player assignment data from roster slot
 */
export function createPlayerAssignment(positionSlot: TeamPositionSlot, slot: PositionSlotKey): PlayerAssignmentData {
    return {
        playerId: positionSlot.player.playerId,
        playerCode: positionSlot.player.playerCode,
        playerName: positionSlot.player.playerName,
        playerPosition: positionSlot.player.playerPosition,
        teamPosition: positionSlot.player.teamPosition,
        teamSlotIndex: positionSlot.player.teamSlotIndex,
        isSub: positionSlot.player.isSub,
        onLoanTo: positionSlot.player.onLoanTo,
        onLoanStart: positionSlot.player.onLoanStart,
        assignedAt: positionSlot.player.assignedAt,
    };
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
function createEmptyPoints(): PointsBreakdown {
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

/**
 * Merge gameweek stats into season totals
 */
export function mergeStatsIntoSeason(
    seasonStats: PlayerGameweekStatsData,
    gameweekStats: PlayerGameweekStatsData,
): PlayerGameweekStatsData {
    return {
        appearance: seasonStats.appearance + gameweekStats.appearance,
        goals: seasonStats.goals + gameweekStats.goals,
        assists: seasonStats.assists + gameweekStats.assists,
        cleanSheets: seasonStats.cleanSheets + gameweekStats.cleanSheets,
        goalsConceded: seasonStats.goalsConceded + gameweekStats.goalsConceded,
        penaltiesSaved: seasonStats.penaltiesSaved + gameweekStats.penaltiesSaved,
        yellowCards: seasonStats.yellowCards + gameweekStats.yellowCards,
        redCards: seasonStats.redCards + gameweekStats.redCards,
        saves: seasonStats.saves + gameweekStats.saves,
        bonus: seasonStats.bonus + gameweekStats.bonus,
    };
}

/**
 * Merge gameweek points into season totals
 */
export function mergePointsIntoSeason(seasonPoints: PointsBreakdown, gameweekPoints: PointsBreakdown): PointsBreakdown {
    const merged = {
        appearance: seasonPoints.appearance + gameweekPoints.appearance,
        goals: seasonPoints.goals + gameweekPoints.goals,
        assists: seasonPoints.assists + gameweekPoints.assists,
        cleanSheets: seasonPoints.cleanSheets + gameweekPoints.cleanSheets,
        yellowCards: seasonPoints.yellowCards + gameweekPoints.yellowCards,
        redCards: seasonPoints.redCards + gameweekPoints.redCards,
        saves: seasonPoints.saves + gameweekPoints.saves,
        penaltiesSaved: seasonPoints.penaltiesSaved + gameweekPoints.penaltiesSaved,
        goalsConceded: seasonPoints.goalsConceded + gameweekPoints.goalsConceded,
        bonus: seasonPoints.bonus + gameweekPoints.bonus,
        total: 0,
    };

    merged.total = Object.entries(merged)
        .filter(([key]) => key !== 'total')
        .reduce((sum, [, value]) => sum + value, 0);

    return merged;
}
