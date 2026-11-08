/* Location: app/transfers/server/transfers.server.ts */

import { fplApiCache } from '../../_shared/lib/fpl/api-cache';
import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import { readPlayers } from '../../_shared/lib/sheets/players';
import type { DivisionId, DivisionSheetData, UserTeamsSheetData } from '../../_shared/types/league-types';
import type { PlayersSheetData } from '../../_shared/types/sheets-types';
import { getManagerCategoryStandings } from '../../leagues/index.server';
import { buildUpcomingFixturesByTeamCode, type UpcomingFixturesByTeamCode } from '../lib/upcoming-fixtures';
import type { TransfersPageData } from '../types/transfer-form-types';
import { getTransfersDataForDivision } from './services/transfers-data.service';

/**
 * Each club's fixtures for the gameweeks from the one this transfer is for. {} when the
 * fixtures cannot be read: the page shows no fixtures rather than failing.
 */
async function loadUpcomingFixtures(fromGameweek: number): Promise<UpcomingFixturesByTeamCode> {
    try {
        const [fixtures, teams] = await Promise.all([fplApiCache.getFplFixtures(), fplApiCache.getFplTeams()]);
        return buildUpcomingFixturesByTeamCode(fixtures, teams, fromGameweek);
    } catch (error) {
        console.error(`Failed to load upcoming fixtures from GW${fromGameweek}:`, error);
        return {};
    }
}

interface GetTransfersPageDataParams {
    selectedDivision: DivisionId;
    selectedUser: UserTeamsSheetData | undefined;
    currentGameweek: number;
    selectedGameweek: number;
    divisions: DivisionSheetData[];
    events: GameWeekData[];
    userTeams: UserTeamsSheetData[];
}

/**
 * Load all data needed for the transfers page
 */
export async function getTransfersPageData({
    selectedDivision,
    selectedUser,
    selectedGameweek,
    currentGameweek,
    currentGameweekData,
    events,
    divisions,
    userTeams,
}: GetTransfersPageDataParams): Promise<TransfersPageData> {
    try {
        console.log('🔄 Loading transfers page data...');

        // Get current gameweek and FPL data
        const gameweeks = events;
        const teamsByCode = await fplApiCache.getTeamsByCode();
        const players = await fplApiCache.getFplPlayers();
        const fplPlayersByCode = await fplApiCache.getPlayersByCode();
        const sheetsPlayers = await readPlayers();
        const managers = userTeams;

        // Calculate transfer deadline
        const selectedGameweekData = events.find((gw) => gw.fplEvent.id === selectedGameweek) || gameweeks[0];
        const transferDeadline = new Date(selectedGameweekData!.fplEvent.deadline_time);
        const isBeforeDeadline = new Date() < transferDeadline;
        const availableGameweeks = Array.from({ length: currentGameweek || 1 }, (_, i) => i + 1);

        const sheetsPlayersByCode = sheetsPlayers.reduce((acc: Record<string, PlayersSheetData>, player) => {
            acc[player.code] = player;
            return acc;
        }, {});
        const availablePlayers = players.filter((player) => sheetsPlayersByCode[player.code]);

        if (!selectedDivision) {
            return {
                divisions,
                currentGameweekData,
                currentGameweek,
                availableGameweeks,
                selectedGameweek,
                selectedGameweekData,
                availablePlayers,
                transferDeadline:
                    transferDeadline.toLocaleDateString('en-gb') +
                    ' ' +
                    transferDeadline.toLocaleTimeString(['en-gb'], { hour: '2-digit', minute: '2-digit' }),
                teamsByCode,
                isBeforeDeadline,
                fplPlayersByCode,
            };
        }
        const divisionManagers = managers.filter((manager) => manager.divisionId === selectedDivision);

        // Category standings are one uncached Firestore read (the division-teams document)
        // plus the cached UserTeams sheet. Upcoming fixtures come from data already cached
        // for every page. Neither ever fails the page: empty means no headers / no fixtures.
        const [
            { transfers: currentTransfers, divisionRosters, validationContext },
            categoryStandings,
            upcomingFixturesByTeamCode,
        ] = await Promise.all([
            getTransfersDataForDivision(selectedDivision, selectedGameweekData, { cache: false }),
            selectedUser ? getManagerCategoryStandings(selectedDivision, selectedUser.userId) : [],
            loadUpcomingFixtures(selectedGameweek),
        ]);

        // Load manager's roster if manager is selected
        const managerRoster = divisionRosters[selectedUser?.userId]?.roster;

        return {
            divisions,
            managers: divisionManagers,
            currentGameweekData,
            currentGameweek,
            availableGameweeks,
            selectedDivision,
            selectedUser: selectedUser?.userId,
            selectedGameweek,
            selectedGameweekData,
            currentTransfers,
            managerRoster,
            categoryStandings,
            upcomingFixturesByTeamCode,
            availablePlayers,
            transferDeadline:
                transferDeadline.toLocaleDateString('en-gb') +
                ' ' +
                transferDeadline.toLocaleTimeString(['en-gb'], { hour: '2-digit', minute: '2-digit' }),
            teamsByCode,
            isBeforeDeadline,
            divisionRosters,
            validationContext,
            fplPlayersByCode,
        };
    } catch (error) {
        console.error('❌ Failed to load transfers page data:', error);
        throw new Error('Failed to load transfers data', {
            cause: error,
        });
    }
}
