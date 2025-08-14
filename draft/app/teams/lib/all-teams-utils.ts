// app/teams/lib/all-teams-utils.ts

import type { DivisionTeamsDocument, UserTeamsSheetData } from '../types/team-types';
import type { AllTeamsData, ManagerInfo, TeamRowData } from '../types/team-view-types';
import { compareByManagerThenPosition, sortPositions } from './sorting-utils';

/**
 * Transform division teams data into flattened table rows
 */
export function transformToTeamRows(
    divisionTeams: DivisionTeamsDocument,
    userTeams: UserTeamsSheetData[],
): AllTeamsData {
    const teamRows: TeamRowData[] = [];
    const managerSet = new Set<string>();
    const positionSet = new Set<string>();

    // Create manager lookup map
    const managerMap = new Map<string, UserTeamsSheetData>();
    userTeams.forEach((team) => {
        managerMap.set(team.userId, team);
    });

    // Process each team's roster
    Object.entries(divisionTeams.teams).forEach(([managerId, teamData]) => {
        const managerInfo = managerMap.get(managerId);
        if (!managerInfo) return;

        managerSet.add(managerId);

        // Process each position slot in the roster
        Object.entries(teamData.roster).forEach(([slotKey, positionSlot]) => {
            if (!positionSlot?.player) return;

            const { player } = positionSlot;
            positionSet.add(player.playerPosition);

            const teamRow: TeamRowData = {
                player,
                managerId,
                managerInfo,
                positionSlot,
                isOnLoan: Boolean(player.onLoanTo || player.onLoanFrom),
                assignedAt: player.assignedAt,
            };

            teamRows.push(teamRow);
        });
    });

    // Create available managers list
    const availableManagers: ManagerInfo[] = Array.from(managerSet)
        .map((managerId) => {
            const managerInfo = managerMap.get(managerId)!;
            return {
                id: managerId,
                name: managerInfo.userName,
                teamName: managerInfo.teamName,
            };
        })
        .sort((a, b) => a.teamName.localeCompare(b.teamName));

    // Create available positions list
    const availablePositions = sortPositions(Array.from(positionSet));

    return {
        teams: teamRows.sort(compareByManagerThenPosition),
        totalPlayers: teamRows.length,
        availablePositions,
        availableManagers,
    };
}
