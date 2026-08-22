/* Location: app/leagues/server/league-standings.server.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { getDivisionUserTeams } from '../../_shared/lib/sheets/user-teams';
import type { DivisionId, DivisionSheetData, PositionSlotKey } from '../../_shared/types/league-types';
import { getDivisionTeamsDocument } from '../../scoring/index.server';
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
}: {
    selectedDivision: DivisionId;
    selectedGameweek?: number;
    currentGameweekData: GameWeekData;
    divisions: DivisionSheetData[];
    events: GameWeekData[];
}): Promise<EnhancedLeagueStandingsLoaderData> {
    const currentGameweek = currentGameweekData.fplEvent.id;
    const division = divisions.find((d) => selectedDivision === d.id)!;
    const targetGameweek = selectedGameweek ?? currentGameweek;
    const targetGameweekData = events.find((e) => e.fplEvent.id === targetGameweek);

    const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);

    const standingsData: Record<string, LeagueStandingsTeamData[]> = {};

    standingsData[selectedDivision] = await getDivisionStandingsWithPositionRankChanges(
        selectedDivision,
        targetGameweek,
    );

    return {
        divisions,
        selectedDivision: division,
        selectedGameweek: targetGameweek,
        selectedGameweekData: targetGameweekData,
        currentGameweekData,
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
