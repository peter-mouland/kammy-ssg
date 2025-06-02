// Server-only imports - these won't be included in client bundle
import { fplApiCache } from "./fpl/api-cache";
import { readUserTeams } from "./sheets/user-teams";
import { readDivisions } from "./sheets/divisions";
import type { UserTeamData, DivisionData, FplPlayerData } from "../types";

export interface DashboardData {
    topPlayers: FplPlayerData[];
    leagueStandings: UserTeamData[];
    divisions: DivisionData[];
    currentGameweek: number;
}

export async function getDashboardData(): Promise<DashboardData> {
    // Fetch data in parallel
    const [
        events,
        topPlayers,
        userTeams,
        divisions
    ] = await Promise.all([
        fplApiCache.getFplEvents(),
        fplApiCache.getTopPerformers(20),
        readUserTeams(),
        readDivisions()
    ]);

    // Get current gameweek
    const currentGameweek = events.find(event => event.is_current)?.id || 1;

    // Get league standings (top 10)
    const leagueStandings = userTeams
        .sort((a, b) => a.leagueRank - b.leagueRank)
        .slice(0, 10);

    return {
        topPlayers,
        leagueStandings,
        divisions,
        currentGameweek
    };
}
