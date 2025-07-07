/* Location: app/transfers/server/transfers.server.ts */

import { fplApiCache } from '../../_shared/lib/fpl/api-cache';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { readDivisions } from '../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../_shared/lib/sheets/user-teams';
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
        const currentGameweek = await fplApiCache.getCurrentGameweek();
        const gameweeks = await fplApiCache.getFplEvents();
        const fplTeams = await fplApiCache.getFplTeams();
        const players = await fplApiCache.getFplPlayers();
        const divisions = await readDivisions();
        const managers = await readUserTeams();

        const gameweekToLoad = selectedGameweek || currentGameweek || 1;

        const gameweekData = gameweeks.find((gw) => gw.fplEvent.id === gameweekToLoad);
        const divisionManagers = managers.filter((manager) => manager.divisionId === selectedDivision);
        const { transfers: currentTransfers, divisionRosters } = await getTransfersForDivision(
            selectedDivision,
            gameweekToLoad,
        );

        const teamsByCode = fplTeams.reduce((acc: Record<number, FplTeam>, team) => {
            acc[team.code] = team;
            return acc;
        }, {});

        // Load manager's roster if manager is selected
        const managerRoster = divisionRosters[selectedManager]?.roster;

        // Calculate transfer deadline
        const transferDeadline = new Date(gameweekData!.fplEvent.deadline_time);
        const isBeforeDeadline = new Date() < transferDeadline;

        // Generate available gameweeks (for historical viewing)
        const availableGameweeks = Array.from({ length: currentGameweek || 1 }, (_, i) => i + 1);

        return {
            divisions,
            managers: divisionManagers,
            currentGameweek,
            availableGameweeks,
            gameweekData,
            selectedDivision: selectedDivision,
            selectedManager: selectedManager,
            selectedGameweek: gameweekToLoad,
            currentTransfers,
            managerRoster,
            availablePlayers: players,
            transferDeadline:
                transferDeadline.toLocaleDateString('en-gb') +
                ' ' +
                transferDeadline.toLocaleTimeString(['en-gb'], { hour: '2-digit', minute: '2-digit' }),
            teamsByCode,
            isBeforeDeadline,
            divisionRosters,
        };
    } catch (error) {
        console.error('❌ Failed to load transfers page data:', error);
        throw new Error(`Failed to load transfers data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
