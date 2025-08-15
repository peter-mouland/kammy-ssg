/* Location: app/leagues/league-standings.route.tsx */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { getUserSelection } from '../_shared/features/user-selection/user-selection.utils';
import { readDivisions } from '../_shared/lib/sheets/divisions';
import { readUserTeams } from '../_shared/lib/sheets/user-teams';
import type { DivisionId } from '../teams/types/team-types';
import { LeagueStandings } from './league-standings';
import type { EnhancedLeagueStandingsLoaderData } from './types/league-standings-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'League Standings - Fantasy Football Draft' },
        { name: 'description', content: 'View detailed standings with position breakdown for each division' },
    ];
};

interface ActionData {
    success?: boolean;
    error?: string;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const { fplApiCache } = await import('../_shared/lib/fpl/api-cache');
        const [currentGameweekData, events, userTeams, divisions] = await Promise.all([
            fplApiCache.getCurrentGameweekData(),
            fplApiCache.getFplEvents(),
            readUserTeams(),
            readDivisions(),
        ]);
        const persistedUser = getUserSelection(request);
        const currentUser = userTeams.find((t) => t.userId === persistedUser.selectedUserId);
        const currentGameweek = currentGameweekData.fplEvent.id;
        const selectedDivision = (params.divisionId || currentUser?.divisionId) as DivisionId;
        const selectedGameweek = Number.parseInt(url.searchParams.get('gameweek') || String(currentGameweek), 10);

        // Dynamic import to keep server code on server
        const { getEnhancedLeagueStandingsData } = await import('./server/league-standings.server');
        const loaderData = await getEnhancedLeagueStandingsData({
            currentGameweekData,
            selectedDivision,
            selectedGameweek,
            divisions,
            events,
        });

        return data<EnhancedLeagueStandingsLoaderData>({ ...loaderData, userTeams, persistedUser });
    } catch (error) {
        console.error('League standings loader error:', error);
        throw new Response('Failed to load enhanced standings data', { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs) {
    try {
        return data<ActionData>();
    } catch (error) {
        console.error('League standings action error:', error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : 'Failed to perform action',
        });
    }
}

export default LeagueStandings;
