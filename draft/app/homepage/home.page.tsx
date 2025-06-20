/* Location: app/homepage/home.page.tsx */

// app/routes/dashboard.tsx
import { useLoaderData } from 'react-router';
import { LayoutGrid } from '../_shared/components/layout-grid';
import { PageHeader } from '../_shared/components/page-header'; // shared
import { RecentActivity } from '../admin/components/ui/recent-activity'; // admin
import { SystemStatus } from '../admin/components/ui/system-status'; // admin
import { DivisionOverview } from '../leagues/components/division-overview'; // leagues
import { LeagueStandings } from '../leagues/components/league-standings'; // leagues
import { TopPlayers } from '../players/components/top-players'; // players
import { GameStats } from '../scoring/components/game-stats'; // scoring
import type { DashboardData } from './types/homepage-types';

export const HomePage = () => {
    const { topPlayers, leagueStandings, divisions, currentGameweek } = useLoaderData<DashboardData>();

    return (
        <div>
            <PageHeader
                title={'Fantasy Football Draft Dashboard'}
                subTitle={`Gameweek ${currentGameweek} • ${divisions.length} Divisions • ${leagueStandings.length}+ Teams`}
            />

            <LayoutGrid>
                <TopPlayers players={topPlayers} />

                <LeagueStandings standings={leagueStandings} />

                <DivisionOverview divisions={divisions} leagueStandings={leagueStandings} />

                <RecentActivity currentGameweek={currentGameweek} divisions={divisions} />

                <SystemStatus />

                <GameStats
                    divisions={divisions}
                    leagueStandings={leagueStandings}
                    topPlayers={topPlayers}
                    currentGameweek={currentGameweek}
                />
            </LayoutGrid>
        </div>
    );
};
