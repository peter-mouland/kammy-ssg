import type { FplPlayerData } from '../../players/types/player-types';
import type { DivisionSheetData, UserTeamData } from '../../teams/types/team-types';

export interface DashboardData {
    topPlayers: FplPlayerData[];
    leagueStandings: UserTeamData[];
    divisions: DivisionSheetData[];
    currentGameweek: number;
}
