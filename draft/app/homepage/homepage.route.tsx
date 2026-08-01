/* Location: app/homepage/homepage.route.tsx */

// app/routes/dashboard.tsx
import type { MetaFunction } from 'react-router';
import { data } from 'react-router';
import { loaderErrorResponse } from '../_shared/lib/loader-error';
import { LeagueStandings } from './home.page';

export const meta: MetaFunction = () => {
    return [
        { title: 'Dashboard - Fantasy Football Draft' },
        { name: 'description', content: 'Fantasy football league dashboard with top players and standings' },
    ];
};

export async function loader() {
    try {
        // Dynamic import to keep server code on server
        const { getAllLeagueStandingsData } = await import('../leagues/index.server');
        const dashboardData = await getAllLeagueStandingsData();
        return data(dashboardData);
    } catch (error) {
        if (error instanceof Response) throw error;
        throw loaderErrorResponse('Could not load the dashboard', error);
    }
}

export default LeagueStandings;
