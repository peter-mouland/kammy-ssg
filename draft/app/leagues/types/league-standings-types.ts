// app/leagues/types/league-standings-types.ts

import type { DivisionId, DivisionSheetData, PositionSlotKey } from '../../teams/types/team-types';

export interface PositionPointsBreakdown {
    gk: number; // gk_0 + sub_0 total
    cb: number; // cb_0 + cb_1 total
    fb: number; // fb_0 + fb_1 total
    mid: number; // mid_0 + mid_1 total
    wa: number; // wa_0 + wa_1 total
    ca: number; // ca_0 + ca_1 total
    total: number; // sum of all positions
}

export interface LeagueStandingsTeamData {
    userId: string;
    userName: string;
    teamName: string;
    gameweekPoints: PositionPointsBreakdown;
    seasonPoints: PositionPointsBreakdown;
}

export interface EnhancedLeagueStandingsLoaderData {
    divisions: DivisionSheetData[];
    selectedDivision: DivisionId;
    selectedGameweek: number;
    currentGameweek: number;
    availableGameweeks: number[];
    standingsData: Record<string, LeagueStandingsTeamData[]>; // by divisionId
}

export interface PositionColumnConfig {
    key: keyof PositionPointsBreakdown;
    label: string;
    slots: PositionSlotKey[];
    color: string;
}
