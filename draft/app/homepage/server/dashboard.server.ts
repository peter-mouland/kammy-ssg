/* Location: app/homepage/server/dashboard.server.ts */

// Server-only imports - these won't be included in client bundle
import { fplApiCache } from "../../_shared/lib/fpl/api-cache";
import { readUserTeams } from "../../_shared/lib/sheets/user-teams";
import { readDivisions } from "../../_shared/lib/sheets/divisions";
import type { DashboardData } from '../types/homepage-types';

export async function getDashboardData(): Promise<DashboardData> {
    // Fetch data in parallel
    const [
        events,
        userTeams,
        divisions
    ] = await Promise.all([
        fplApiCache.getFplEvents(),
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
        leagueStandings,
        divisions,
        currentGameweek
    };
}
