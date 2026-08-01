/* Location: app/teams/team.route.tsx */

// app/teams/team.route.tsx
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { loaderErrorResponse } from '../_shared/lib/loader-error';
import { TeamView } from './components/team-view';
import type { TeamViewData } from './types/team-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'My Team - Fantasy Football' },
        { name: 'description', content: 'View your fantasy football team and formation' },
    ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const { loadTeamData } = await import('./server/team.server');
        const teamData = await loadTeamData({ request, params });
        return data<TeamViewData>(teamData);
    } catch (error) {
        throw loaderErrorResponse('Could not load this team', error);
    }
}

export default TeamView;
