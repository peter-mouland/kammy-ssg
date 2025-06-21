/* Location: app/leagues/server/league-standings.server.ts */

import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { getUserTeamsByDivision } from '../../_shared/lib/sheets/user-teams';
import type { DivisionId, PositionSlotKey } from '../../teams/types/team-types';
import type {
    EnhancedLeagueStandingsLoaderData,
    LeagueStandingsTeamData,
    PositionPointsBreakdown,
} from '../types/league-standings-types';

export async function getEnhancedLeagueStandingsData(
    selectedDivision: DivisionId,
    selectedGameweek?: number,
): Promise<EnhancedLeagueStandingsLoaderData> {
    // Import services dynamically to keep server code on server
    const { getDivisionTeamsDocument } = await import('../../scoring/server/services/division-teams.service');
    const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');

    const divisions = await readDivisions();
    const currentGameweek = await fplApiCache.getCurrentGameweek();
    const targetGameweek = selectedGameweek ?? currentGameweek;

    const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);

    const standingsData: Record<string, LeagueStandingsTeamData[]> = {};

    // Get data for specific division
    const divisionStandings = await getDivisionStandingsData(
        selectedDivision,
        targetGameweek,
        getDivisionTeamsDocument,
    );
    standingsData[selectedDivision] = divisionStandings;

    return {
        divisions,
        selectedDivision,
        selectedGameweek: targetGameweek,
        currentGameweek,
        availableGameweeks,
        standingsData,
    };
}

async function getDivisionStandingsData(
    divisionId: string,
    gameweek: number,
    getDivisionTeamsDocument: any,
): Promise<LeagueStandingsTeamData[]> {
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

export async function handleLeagueStandingsAction(formData: FormData) {
    const actionType = formData.get('actionType');

    switch (actionType) {
        default:
            throw new Error('Invalid action type');
    }
}
