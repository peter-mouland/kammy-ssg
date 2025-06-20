import type { DivisionSheetData, UserTeamsSheetData } from '../../teams/types/team-types';

export interface DashboardData {
    leagueStandings: UserTeamsSheetData[];
    divisions: DivisionSheetData[];
    currentGameweek: number;
}
