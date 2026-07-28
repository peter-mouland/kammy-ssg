// app/teams/types/team-view-types.ts

import type { ManagerId, UserTeamsSheetData } from '../../_shared/types/league-types';
import type { TeamPositionSlot } from './team-types';

/**
 * Tab management types
 */
export type TeamViewTab = 'my-team' | 'all-teams' | 'totw';

/**
 * All teams view data
 */
export interface AllTeamsData {
    teams: TeamRowData[];
    totalPlayers: number;
    availablePositions: string[];
    availableManagers: ManagerInfo[];
}

/**
 * Manager info for filtering
 */
export interface ManagerInfo {
    id: string;
    name: string;
    teamName: string;
}

/**
 * Flattened team row data for table display
 */
export interface TeamRowData {
    player: TeamPositionSlot['player'];
    managerId: ManagerId;
    managerInfo: UserTeamsSheetData;
    positionSlot: TeamPositionSlot;
    isOnLoan: boolean;
    assignedAt: string;
}

/**
 * Tab component props
 */
export interface TeamViewTabsProps {
    activeTab: TeamViewTab;
    onTabChange: (tab: TeamViewTab) => void;
    teamCount?: number;
    playerCount?: number;
}

/**
 * Team filters for the all teams view
 */
export interface TeamFilters {
    manager?: string;
    position?: string;
    loanStatus?: 'all' | 'regular' | 'loaned-out' | 'loaned-in';
    substitute?: 'all' | 'starters' | 'subs';
    search?: string;
}
