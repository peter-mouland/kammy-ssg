/* Location: app/leagues/types/league-standings-types.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { CustomPosition } from '../../players/types/player-types';
import type { DivisionSheetData, ManagerId, PositionSlotKey } from '../../teams/types/team-types';

export interface PositionPointsBreakdown {
    gk: number; // gk_0 + sub_0 total
    cb: number; // cb_0 + cb_1 total
    fb: number; // fb_0 + fb_1 total
    mid: number; // mid_0 + mid_1 total
    wa: number; // wa_0 + wa_1 total
    ca: number; // ca_0 + ca_1 total
    total: number; // sum of all positions
}

export interface PositionRankChange {
    gk: number | null;
    cb: number | null;
    fb: number | null;
    mid: number | null;
    wa: number | null;
    ca: number | null;
    total: number | null; // Add this line
}

export interface LeagueStandingsTeamData {
    userId: string;
    userName: string;
    teamName: string;
    gameweekPoints: PositionPointsBreakdown;
    seasonPoints: PositionPointsBreakdown;
    positionRankChanges?: PositionRankChange;
}

export interface TeamOfTheWeekPlayer {
    code: number;
    web_name: string;
    team_code: number;
    position: CustomPosition;
    points: number;
    manager_name?: string;
}

export interface TeamOfTheWeekData {
    gameweek: number;
    players: {
        gk: TeamOfTheWeekPlayer[];
        cb: TeamOfTheWeekPlayer[];
        fb: TeamOfTheWeekPlayer[];
        mid: TeamOfTheWeekPlayer[];
        wa: TeamOfTheWeekPlayer[];
        ca: TeamOfTheWeekPlayer[];
    };
    teamsByCode: Record<number, { short_name: string }>;
}

export interface EnhancedLeagueStandingsLoaderData {
    divisions: DivisionSheetData[];
    selectedDivision: DivisionSheetData;
    selectedGameweek: number;
    selectedGameweekData: GameWeekData;
    currentGameweek: number;
    currentGameweekData: GameWeekData;
    availableGameweeks: number[];
    standingsData: Record<string, LeagueStandingsTeamData[]>;
    persistedUser: { selectedUserId: ManagerId | null; requiresSelection: boolean };
}

export interface PositionColumnConfig {
    key: keyof PositionPointsBreakdown;
    label: string;
    slots: PositionSlotKey[];
}
