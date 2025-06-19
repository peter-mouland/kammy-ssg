import type { FplPlayerData } from '../../_shared/lib/fpl/fpl-types';
import type { DivisionSheetData, UserTeamData } from '../../teams/types/team-types';

export interface DashboardData {
    leagueStandings: UserTeamData[];
    divisions: DivisionSheetData[];
    currentGameweek: number;
}
