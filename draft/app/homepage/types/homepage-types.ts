import type { FplPlayerData } from '../../_shared/lib/fpl/fpl-types';
import type { DivisionSheetData, UserTeamsSheetData } from '../../teams/types/team-types';

export interface DashboardData {
    leagueStandings: UserTeamsSheetData[];
    divisions: DivisionSheetData[];
    currentGameweek: number;
}
