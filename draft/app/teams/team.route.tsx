/* Location: app/teams/team.route.tsx */

// app/teams/team.route.tsx
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { UserSelectionProvider } from '../_shared/features/user-selection/user-selection-provider';
import { TeamView } from './components/team-view';
import type { TeamViewData, UserTeamsSheetData } from './types/team-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'My Team - Fantasy Football' },
        { name: 'description', content: 'View your fantasy football team and formation' },
    ];
};

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const { loadTeamData } = await import('./server/team.server');
        const teamData = await loadTeamData({ request });
        return data<TeamViewData>(teamData);
    } catch (error) {
        console.error('Team loader error:', error);
        throw new Response('Failed to load team data', { status: 500 });
    }
}

export default TeamView;
