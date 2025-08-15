/* Location: app/transfers/server/transfers.server.ts */

import { fplApiCache } from '../../_shared/lib/fpl/api-cache';
import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import { readPlayers } from '../../_shared/lib/sheets/players';
import type { PlayersSheetData } from '../../_shared/types/sheets-types';
import type { DivisionId, DivisionSheetData, UserTeamsSheetData } from '../../teams/types/team-types';
import type { TransfersPageData } from '../types/transfer-form-types';
import { getTransfersDataForDivision } from './services/transfers-data.service';

interface GetTransfersPageDataParams {
    selectedDivision: DivisionId;
    selectedUser: UserTeamsSheetData | undefined;
    selectedGameweek: number;
    divisions: DivisionSheetData[];
    events: GameWeekData[];
}

/**
 * Load all data needed for the transfers page
 */
export async function getTransfersPageData({
    selectedDivision,
    selectedUser,
    selectedGameweek,
    currentGameweekData,
    events,
    divisions,
    userTeams,
}: GetTransfersPageDataParams): Promise<TransfersPageData> {
    try {
        console.log('🔄 Loading transfers page data...');

        // Get current gameweek and FPL data
        const currentGameweek = currentGameweekData.fplEvent.id;
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

        const {
            transfers: currentTransfers,
            divisionRosters,
            validationContext,
        } = await getTransfersDataForDivision(selectedDivision, selectedGameweekData, { cache: false });

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
        throw new Error(`Failed to load transfers data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
