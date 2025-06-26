/* Location: app/transfers/server/transfers.server.ts */

import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../_shared/lib/sheets/user-teams';
import { getPlayerStatsData } from '../../players/server/players.server';
import { getDivisionTeamsDocument } from '../../scoring/server/services/division-teams.service';
import type { DivisionId, ManagerId } from '../../teams/types/team-types';
import type { TransfersPageData } from '../types/transfer-form-types';
import { getTransfersForDivision } from './services/transfers-data.service';

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
        const { fplApiCache } = await import('../../_shared/lib/fpl/api-cache');
        const currentGameweek = await fplApiCache.getCurrentGameweek();
        const gameweeks = await fplApiCache.getFplEvents();
        const gameweekToLoad = selectedGameweek || currentGameweek || 1;
        const gameweekData = gameweeks.find((gw) => gw.fplEvent.id === gameweekToLoad);

        const divisions = await readDivisions();
        const managers = await readUserTeams();
        const divisionManagers = managers.filter((manager) => manager.divisionId === selectedDivision);
        const currentTransfers = await getTransfersForDivision(selectedDivision, gameweekToLoad);

        // Load manager's roster if manager is selected
        const divisionDocument = await getDivisionTeamsDocument(selectedDivision, gameweekToLoad);
        const managerRoster = divisionDocument?.teams[selectedManager]?.roster;
        const { players } = await getPlayerStatsData();

        // Calculate transfer deadline
        const transferDeadline = gameweekData.fplEvent.deadline_time;
        const isBeforeDeadline = new Date() < new Date(transferDeadline);

        // Generate available gameweeks (for historical viewing)
        const availableGameweeks = Array.from({ length: currentGameweek }, (_, i) => i + 1);

        return {
            divisions,
            managers: divisionManagers,
            currentGameweek,
            availableGameweeks,
            gameweekData,
            selectedDivision: selectedDivision as DivisionId,
            selectedManager: selectedManager as ManagerId,
            selectedGameweek: gameweekToLoad,
            currentTransfers,
            managerRoster,
            availablePlayers: players,
            transferDeadline,
            isBeforeDeadline,
        };
    } catch (error) {
        console.error('❌ Failed to load transfers page data:', error);
        throw new Error(`Failed to load transfers data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
