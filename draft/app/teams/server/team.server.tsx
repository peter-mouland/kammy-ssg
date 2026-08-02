// app/teams/server/team.server.ts

import { getUserSelection } from '../../_shared/features/user-selection/user-selection.utils';
import { describeGameweekAvailability } from '../../_shared/lib/gameweek-availability';
import { friendlyErrorResponse } from '../../_shared/lib/loader-error';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../_shared/lib/sheets/user-teams';
import { getTeamsForGameweek } from '../../scoring/index.server';
import { transformToTeamRows } from '../lib/all-teams-utils';
import type { TeamViewData } from '../types/team-types';

export async function loadTeamData({ request, params }): Promise<TeamViewData> {
    const url = new URL(request.url);
    try {
        const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');
        const [currentGameweekData, teamsByCode, fplPlayersByCode, events, userTeams, divisions] = await Promise.all([
            fplApiCache.getCurrentGameweekData(),
            fplApiCache.getTeamsByCode(),
            fplApiCache.getPlayersByCode(),
            fplApiCache.getFplEvents(),
            readUserTeams(),
            readDivisions(),
        ]);
        // No current gameweek is an explainable state, not a crash. Thrown rather than
        // returned so it passes through the catch below untouched -- see the guard there.
        const availability = describeGameweekAvailability(events, currentGameweekData);
        if (!availability.available) {
            throw friendlyErrorResponse(availability.title, availability.detail);
        }

        const persistedUser = getUserSelection(request, params);
        const currentUser = userTeams.find((t) => t.userId === persistedUser.selectedUserId);
        const currentGameweek = currentGameweekData.fplEvent.id;
        const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);
        const gameweekParam = url.searchParams.get('gameweek');
        const parsedGameweek = gameweekParam ? Number.parseInt(gameweekParam, 10) : currentGameweek;
        const targetGameweek = Number.isNaN(parsedGameweek) ? currentGameweek : parsedGameweek;
        const selectedGameweekData = events.find((e) => e.fplEvent.id === targetGameweek) || currentGameweekData;

        if (!currentUser) {
            return {
                currentGameweek,
                currentGameweekData,
                selectedGameweekData,
                availableGameweeks,
                teamsByCode,
                fplPlayersByCode,
                userTeams: userTeams.sort((a, b) => (a.userId < b.userId ? -1 : 1)),
            };
        }

        // Get user's division
        const division = divisions.find((d) => d.id === currentUser.divisionId);
        if (!division) {
            // The manager is assigned to a division the `Divisions` sheet does not list --
            // a sheet mismatch, which nobody can act on from a bare "Division not found".
            throw friendlyErrorResponse(
                'This manager’s division is missing',
                `${currentUser.userId} is assigned to “${currentUser.divisionId}”, which is not listed in the ` +
                    'Divisions sheet. Add it there, or correct the manager’s division in UserTeams.',
            );
        }

        // Get current team data from new division-teams structure
        const currentTeams = await getTeamsForGameweek(currentUser.divisionId, currentUser.userId, targetGameweek);
        if (!currentTeams) {
            // Not a fault: the division genuinely has no `division-teams` document for this
            // gameweek yet. It read as a crash ("Failed to load team data") because it was
            // thrown as a bare Error, which sent people looking for a bug in the loader
            // rather than at the admin step that has not been run.
            console.info(
                `No division-teams document for ${currentUser.divisionId} gw${targetGameweek} (user ${currentUser.userId})`,
            );
            throw friendlyErrorResponse(
                'This team has not been set up yet',
                `${division.label} has no squad data for gameweek ${targetGameweek}. ` +
                    'An admin needs to commit teams for this division from Settings → Admin, then run points processing.',
            );
        }

        // Check if we need to load all teams data (for 'all-teams' tab)
        const allTeamsData = transformToTeamRows(currentTeams.divisionDoc, userTeams);

        // Get Team of the Week with manager ownership data
        const { getTeamOfTheWeek } = await import('../../leagues/index.server');
        const teamOfTheWeek = await getTeamOfTheWeek(targetGameweek, {
            divisionDoc: currentTeams.divisionDoc,
            userTeams,
        });

        return {
            persistedUser,
            currentUser,
            division,
            currentGameweek,
            currentGameweekData,
            selectedGameweekData,
            currentTeam: currentTeams,
            availableGameweeks,
            allTeamsData,
            teamsByCode,
            fplPlayersByCode,
            userTeams: userTeams.sort((a, b) => (a.userId < b.userId ? -1 : 1)),
            teamOfTheWeek: teamOfTheWeek ?? undefined,
        };
    } catch (error) {
        // A thrown Response is a deliberate result -- the friendly "no gameweek" state
        // above -- not a failure to wrap.
        if (error instanceof Response) throw error;

        console.error('Load team data error:', error);
        throw new Error('Failed to load team data', {
            cause: error,
        });
    }
}
