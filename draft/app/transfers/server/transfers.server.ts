/* Location: app/transfers/server/transfers.server.ts */

import { fplApiCache } from '../../_shared/lib/fpl/api-cache';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { readPlayers } from '../../_shared/lib/sheets/players';
import { readUserTeams } from '../../_shared/lib/sheets/user-teams';
import type { PlayersSheetData } from '../../_shared/types/sheets-types';
import type { DivisionId, ManagerId } from '../../teams/types/team-types';
import type { TransfersPageData } from '../types/transfer-form-types';
import { getTransfersDataForDivision } from './services/transfers-data.service';

interface GetTransfersPageDataParams {
    selectedDivision: DivisionId;
    selectedManager: ManagerId;
    selectedGameweek: number;
}

/**
 * Load all data needed for the transfers page
 */
export async function getTransfersPageData({
    selectedDivision,
    selectedManager,
    selectedGameweek,
}: GetTransfersPageDataParams): Promise<TransfersPageData> {
    try {
        console.log('🔄 Loading transfers page data...');

        // Get current gameweek and FPL data
        const currentGameweekData = await fplApiCache.getCurrentGameweekData();
        const currentGameweek = currentGameweekData.fplEvent.id;
        const gameweeks = await fplApiCache.getFplEvents();
        const teamsByCode = await fplApiCache.getTeamsByCode();
        const players = await fplApiCache.getFplPlayers();
        const fplPlayersByCode = await fplApiCache.getPlayersByCode();
        const sheetsPlayers = await readPlayers();
        const divisions = await readDivisions();
        const managers = await readUserTeams();

        const gameweekToLoad = selectedGameweek || currentGameweek || 1;
        const selectedGameweekData = gameweeks.find((gw) => gw.fplEvent.id === gameweekToLoad) || gameweeks[0];
        const divisionManagers = managers.filter((manager) => manager.divisionId === selectedDivision);

        const {
            transfers: currentTransfers,
            divisionRosters,
            validationContext,
        } = await getTransfersDataForDivision(selectedDivision, selectedGameweekData);

        const sheetsPlayersByCode = sheetsPlayers.reduce((acc: Record<string, PlayersSheetData>, player) => {
            acc[player.code] = player;
            return acc;
        }, {});
        const availablePlayers = players.filter((player) => sheetsPlayersByCode[player.code]);

        // Load manager's roster if manager is selected
        const managerRoster = divisionRosters[selectedManager]?.roster;

        // Calculate transfer deadline
        const transferDeadline = new Date(selectedGameweekData!.fplEvent.deadline_time);
        const isBeforeDeadline = new Date() < transferDeadline;

        // Generate available gameweeks (for historical viewing)
        const availableGameweeks = Array.from({ length: currentGameweek || 1 }, (_, i) => i + 1);

        return {
            divisions,
            managers: divisionManagers,
            currentGameweekData,
            currentGameweek,
            availableGameweeks,
            selectedDivision: selectedDivision,
            selectedManager: selectedManager,
            selectedGameweek: gameweekToLoad,
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
