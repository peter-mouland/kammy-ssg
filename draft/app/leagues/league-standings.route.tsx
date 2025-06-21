/* Location: app/leagues/league-standings.route.tsx */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
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

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const selectedDivision: DivisionId = (url.searchParams.get('division') || 'leagueOne') as DivisionId;
        const selectedGameweek = Number.parseInt(url.searchParams.get('gameweek') || '0', 10);

        // Dynamic import to keep server code on server
        const { getEnhancedLeagueStandingsData } = await import('./server/league-standings.server');
        const loaderData = await getEnhancedLeagueStandingsData(selectedDivision, selectedGameweek);

        return data<EnhancedLeagueStandingsLoaderData>(loaderData);
    } catch (error) {
        console.error('League standings loader error:', error);
        throw new Response('Failed to load enhanced standings data', { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs) {
    try {
        const formData = await requestFormData({ request, context });

        // Dynamic import to keep server code on server
        const { handleLeagueStandingsAction } = await import('./server/league-standings.server');
        const result = await handleLeagueStandingsAction(formData);

        return data<ActionData>(result);
    } catch (error) {
        console.error('League standings action error:', error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : 'Failed to perform action',
        });
    }
}

export default LeagueStandings;
