/* Location: app/leagues/server/league-standings.server.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { getDivisionUserTeams } from '../../_shared/lib/sheets/user-teams';
import type { DivisionId, DivisionSheetData, PositionSlotKey } from '../../_shared/types/league-types';
import { getDivisionTeamsDocument } from '../../scoring/index.server';
import { getCategoryStandings } from '../lib/category-standings';
import { type GameweekRange, gameweekScoringWindows, gameweeksInRange } from '../lib/gameweek-range';
import { calculatePositionRankings } from '../lib/simple-position-rankings';
import type {
    CategoryStanding,
    EnhancedLeagueStandingsLoaderData,
    LeagueStandingsTeamData,
    PositionPointsBreakdown,
    PositionRankChange,
} from '../types/league-standings-types';

export async function getAllLeagueStandingsData(): Promise<EnhancedLeagueStandingsLoaderData> {
    // Import services dynamically to keep server code on server
    const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');

    const divisions = await readDivisions();
    const currentGameweek = await fplApiCache.getScoringGameweek();
    const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);

    // Get data for specific division with position rank changes
    // Partial: it is filled in per division below, and which divisions exist is data.
    const standingsData: Partial<Record<DivisionId, LeagueStandingsTeamData[]>> = {};
    const standingsPromises = divisions.map(async (division) => {
        standingsData[division.id] = await getDivisionStandingsWithPositionRankChanges(division.id, currentGameweek);
    });

    await Promise.all(standingsPromises);

    return {
        divisions,
        selectedGameweek: currentGameweek,
        currentGameweek,
        availableGameweeks,
        standingsData,
    };
}

export async function getEnhancedLeagueStandingsData({
    selectedDivision,
    selectedGameweek,
    currentGameweekData,
    divisions,
    events,
    selectedRange = null,
}: {
    selectedDivision: DivisionId;
    selectedGameweek?: number;
    currentGameweekData: GameWeekData;
    divisions: DivisionSheetData[];
    events: GameWeekData[];
    /** When set, the page shows points summed over these gameweeks instead of the season. */
    selectedRange?: GameweekRange | null;
}): Promise<EnhancedLeagueStandingsLoaderData> {
    const currentGameweek = currentGameweekData.fplEvent.id;
    const division = divisions.find((d) => selectedDivision === d.id)!;
    const targetGameweek = selectedGameweek ?? currentGameweek;
    const targetGameweekData = events.find((e) => e.fplEvent.id === targetGameweek);

    const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);

    const standingsData: Record<string, LeagueStandingsTeamData[]> = {};

    standingsData[selectedDivision] = selectedRange
        ? await getDivisionRangeStandings(selectedDivision, selectedRange)
        : await getDivisionStandingsWithPositionRankChanges(selectedDivision, targetGameweek);

    return {
        divisions,
        selectedDivision: division,
        selectedGameweek: targetGameweek,
        selectedGameweekData: targetGameweekData,
        currentGameweekData,
        currentGameweek,
        availableGameweeks,
        standingsData,
        selectedRange,
        rangeGameweeks: selectedRange ? gameweekScoringWindows(selectedRange, events) : [],
    };
}

const emptyBreakdown = (): PositionPointsBreakdown => ({ gk: 0, cb: 0, fb: 0, mid: 0, wa: 0, ca: 0, total: 0 });

function addBreakdowns(a: PositionPointsBreakdown, b: PositionPointsBreakdown): PositionPointsBreakdown {
    return {
        gk: a.gk + b.gk,
        cb: a.cb + b.cb,
        fb: a.fb + b.fb,
        mid: a.mid + b.mid,
        wa: a.wa + b.wa,
        ca: a.ca + b.ca,
        total: a.total + b.total,
    };
}

/**
 * Points scored across a run of gameweeks -- a mini-season, which is what a monthly prize is.
 *
 * Summed from each gameweek's own points rather than taken as a difference of season totals:
 * a slot's season figure follows whoever is in it now, so after a transfer the difference
 * would credit the new player's earlier weeks. Each gameweek document already records who
 * was in the slot that week.
 *
 * The result goes in `gameweekPoints` so the existing table renders it as-is. `seasonPoints`
 * is left empty: the season is not what this view is about.
 */
async function getDivisionRangeStandings(
    divisionId: DivisionId,
    range: GameweekRange,
): Promise<LeagueStandingsTeamData[]> {
    try {
        const [userTeams, ...divisionDocs] = await Promise.all([
            getDivisionUserTeams(divisionId),
            ...gameweeksInRange(range).map((gameweek) => getDivisionTeamsDocument(divisionId, gameweek)),
        ]);

        const totals = new Map<string, PositionPointsBreakdown>();
        for (const divisionDoc of divisionDocs) {
            if (!divisionDoc) continue;
            for (const [userId, teamData] of Object.entries(divisionDoc.teams)) {
                const weekPoints = calculatePositionPoints(teamData.roster, 'gameweek');
                totals.set(userId, addBreakdowns(totals.get(userId) ?? emptyBreakdown(), weekPoints));
            }
        }

        const standings: LeagueStandingsTeamData[] = [];
        for (const userTeam of userTeams) {
            const gameweekPoints = totals.get(userTeam.userId);
            if (!gameweekPoints) continue;
            standings.push({
                userId: userTeam.userId,
                userName: userTeam.userName,
                teamName: userTeam.teamName,
                gameweekPoints,
                seasonPoints: emptyBreakdown(),
            });
        }

        return standings.sort((a, b) => b.gameweekPoints.total - a.gameweekPoints.total);
    } catch (error) {
        console.error(`Failed to get range standings for ${divisionId} GW${range.from}-${range.to}:`, error);
        return [];
    }
}

/**
 * One manager's season standing in each scoring category, as at the gameweek the league
 * table shows. [] when there is nothing to show — this is decision support, never a
 * reason for a page to fail.
 */
export async function getManagerCategoryStandings(divisionId: DivisionId, userId: string): Promise<CategoryStanding[]> {
    try {
        const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');
        const gameweek = await fplApiCache.getScoringGameweek();
        const standings = await getDivisionStandingsData(divisionId, gameweek);
        return getCategoryStandings(standings, userId);
    } catch (error) {
        console.error(`Failed to get category standings for ${userId} in ${divisionId}:`, error);
        return [];
    }
}

async function getDivisionStandingsWithPositionRankChanges(
    divisionId: DivisionId,
    gameweek: number,
): Promise<LeagueStandingsTeamData[]> {
    const previousGameweek = gameweek === 0 ? 0 : gameweek - 1;
    try {
        const currentStandings = await getDivisionStandingsData(divisionId, gameweek);
        const previousStandings = await getDivisionStandingsData(divisionId, previousGameweek);
        // Calculate position rank changes
        return calculatePositionRankChanges(currentStandings, previousStandings);
    } catch (error) {
        console.error(
            `Failed to get division standings with position rank changes for ${divisionId} GW${gameweek}:`,
            error,
        );
        return [];
    }
}

async function getDivisionStandingsData(divisionId: DivisionId, gameweek: number): Promise<LeagueStandingsTeamData[]> {
    try {
        // Get division teams document for the gameweek
        const divisionDoc = await getDivisionTeamsDocument(divisionId, gameweek);
        if (!divisionDoc) {
            console.warn(`No division document found for ${divisionId} GW${gameweek}`);
            return [];
        }

        // Get user team sheet data for names
        const userTeams = await getDivisionUserTeams(divisionId);
        const userTeamMap = new Map(userTeams.map((team) => [team.userId, team]));
        const standings: LeagueStandingsTeamData[] = [];

        // Process each team in the division document
        for (const [userId, teamData] of Object.entries(divisionDoc.teams)) {
            const userTeam = userTeamMap.get(userId);
            if (!userTeam) {
                console.warn(`User team data not found for ${userId} in ${divisionId}`);
                continue;
            }

            // Calculate position points breakdown
            const gameweekPoints = calculatePositionPoints(teamData.roster, 'gameweek');
            const seasonPoints = calculatePositionPoints(teamData.roster, 'season');

            standings.push({
                userId,
                userName: userTeam.userName,
                teamName: userTeam.teamName,
                gameweekPoints,
                seasonPoints,
            });
        }

        // Sort by season total points (descending)
        standings.sort((a, b) => b.seasonPoints.total - a.seasonPoints.total);

        return standings;
    } catch (error) {
        console.error(`Failed to get division standings for ${divisionId} GW${gameweek}:`, error);
        return [];
    }
}

function calculatePositionPoints(
    roster: Record<PositionSlotKey, any>,
    pointsType: 'gameweek' | 'season',
): PositionPointsBreakdown {
    const breakdown: PositionPointsBreakdown = {
        gk: 0,
        cb: 0,
        fb: 0,
        mid: 0,
        wa: 0,
        ca: 0,
        total: 0,
    };

    // Aggregate points by position type
    for (const [slotKey, positionSlot] of Object.entries(roster)) {
        const slot = slotKey as PositionSlotKey;
        const points = positionSlot?.[pointsType]?.points?.total || 0;

        // Map slot to position type and add points
        if (slot.startsWith('gk_') || slot.startsWith('sub_')) {
            breakdown.gk += points;
        } else if (slot.startsWith('cb_')) {
            breakdown.cb += points;
        } else if (slot.startsWith('fb_')) {
            breakdown.fb += points;
        } else if (slot.startsWith('mid_')) {
            breakdown.mid += points;
        } else if (slot.startsWith('wa_')) {
            breakdown.wa += points;
        } else if (slot.startsWith('ca_')) {
            breakdown.ca += points;
        }
    }

    // Calculate total
    breakdown.total = breakdown.gk + breakdown.cb + breakdown.fb + breakdown.mid + breakdown.wa + breakdown.ca;

    return breakdown;
}

function calculatePositionRankChanges(
    currentStandings: LeagueStandingsTeamData[],
    previousStandings: LeagueStandingsTeamData[] | null,
): LeagueStandingsTeamData[] {
    if (!previousStandings) {
        // First gameweek - no rank changes to calculate
        return currentStandings;
    }

    // Use your existing ranking logic to calculate rankings for both gameweeks
    const currentRankings = calculatePositionRankings(currentStandings, 'seasonPoints');
    const previousRankings = calculatePositionRankings(previousStandings, 'seasonPoints');
    // Calculate rank changes for each team
    return currentStandings.map((team) => {
        const positionRankChanges: PositionRankChange = {
            gk: null,
            cb: null,
            fb: null,
            mid: null,
            wa: null,
            ca: null,
            total: null,
        };

        const positionKeys: (keyof PositionRankChange)[] = ['gk', 'cb', 'fb', 'mid', 'wa', 'ca', 'total'];

        positionKeys.forEach((position) => {
            const currentRankScore = currentRankings[team.userId]?.[position];
            const previousRankScore = previousRankings[team.userId]?.[position];

            if (currentRankScore !== undefined && previousRankScore !== undefined) {
                // Convert rank scores back to ranks for display
                // Higher rank score = better rank (lower number)
                const currentRank = convertRankScoreToRank(currentRankScore, currentStandings.length);
                const previousRank = convertRankScoreToRank(previousRankScore, previousStandings.length);

                // Calculate rank change: previousRank - currentRank
                // Positive = moved up, Negative = moved down
                positionRankChanges[position] = previousRank - currentRank;
            }
        });

        return {
            ...team,
            positionRankChanges,
        };
    });
}

function convertRankScoreToRank(rankScore: number, numTeams: number): number {
    // Convert rank score back to 1-based rank
    // Rank score 0 = worst rank (numTeams), rank score (numTeams-1) = best rank (1)
    return numTeams - rankScore;
}
