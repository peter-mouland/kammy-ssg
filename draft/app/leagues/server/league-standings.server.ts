/* Location: app/leagues/server/league-standings.server.ts */

import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { getUserTeamsByDivision } from '../../_shared/lib/sheets/user-teams';
import { getDivisionTeamsDocument } from '../../scoring/server/services/division-teams.service';
import type { DivisionId, PositionSlotKey } from '../../teams/types/team-types';
import { calculatePositionRankings } from '../lib/simple-position-rankings';
import type {
    EnhancedLeagueStandingsLoaderData,
    LeagueStandingsTeamData,
    PositionPointsBreakdown,
    PositionRankChange,
} from '../types/league-standings-types';

export async function getAllLeagueStandingsData(): Promise<EnhancedLeagueStandingsLoaderData> {
    // Import services dynamically to keep server code on server
    const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');

    const divisions = await readDivisions();
    const currentGameweek = await fplApiCache.getCurrentGameweek();
    const targetGameweek = currentGameweek;

    const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);

    const standingsData: Record<DivisionId, LeagueStandingsTeamData[]> = {};

    // Get data for specific division with position rank changes
    standingsData['premierLeague'] = await getDivisionStandingsWithPositionRankChanges('premierLeague', targetGameweek);
    standingsData['championship'] = await getDivisionStandingsWithPositionRankChanges('championship', targetGameweek);
    standingsData['leagueOne'] = await getDivisionStandingsWithPositionRankChanges('leagueOne', targetGameweek);

    return {
        divisions,
        selectedGameweek: targetGameweek,
        currentGameweek,
        availableGameweeks,
        standingsData,
    };
}

export async function getEnhancedLeagueStandingsData({
    selectedDivision,
    selectedGameweek,
}: {
    selectedDivision: DivisionId;
    selectedGameweek?: number;
}): Promise<EnhancedLeagueStandingsLoaderData> {
    // Import services dynamically to keep server code on server
    const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');

    const divisions = await readDivisions();
    const division = divisions.find((d) => selectedDivision === d.id)!;
    const currentGameweek = await fplApiCache.getCurrentGameweek();
    const targetGameweek = selectedGameweek ?? currentGameweek;

    const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);

    const standingsData: Record<string, LeagueStandingsTeamData[]> = {};

    // Get data for specific division with position rank changes
    const divisionStandings = await getDivisionStandingsWithPositionRankChanges(selectedDivision, targetGameweek);
    standingsData[selectedDivision] = divisionStandings;

    return {
        divisions,
        selectedDivision: division,
        selectedGameweek: targetGameweek,
        currentGameweek,
        availableGameweeks,
        standingsData,
    };
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
        const userTeams = await getUserTeamsByDivision(divisionId);
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

function calculatePositionRanks(
    standings: LeagueStandingsTeamData[],
    positionKeys: (keyof PositionPointsBreakdown)[],
): Record<keyof PositionPointsBreakdown, Map<string, number>> {
    const positionRanks: Record<keyof PositionPointsBreakdown, Map<string, number>> = {
        gk: new Map(),
        cb: new Map(),
        fb: new Map(),
        mid: new Map(),
        wa: new Map(),
        ca: new Map(),
        total: new Map(),
    };

    positionKeys.forEach((position) => {
        // Sort teams by position points (descending)
        const sortedByPosition = [...standings].sort((a, b) => b.gameweekPoints[position] - a.gameweekPoints[position]);

        // Assign ranks (1-based)
        sortedByPosition.forEach((team, index) => {
            positionRanks[position].set(team.userId, index + 1);
        });
    });

    return positionRanks;
}

export async function handleLeagueStandingsAction(formData: FormData | URLSearchParams) {
    // Handle any actions needed for league standings
    // This can be extended for future functionality
    return { success: true };
}

function convertRankScoreToRank(rankScore: number, numTeams: number): number {
    // Convert rank score back to 1-based rank
    // Rank score 0 = worst rank (numTeams), rank score (numTeams-1) = best rank (1)
    return numTeams - rankScore;
}
