import { Link, useLoaderData } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import type { EnhancedLeagueStandingsLoaderData } from '../leagues';
import { PositionPointsTable } from '../leagues';

export const LeagueStandings = () => {
    const { divisions, selectedGameweek, standingsData } = useLoaderData<EnhancedLeagueStandingsLoaderData>();

    return (
        <div>
            <PageHeader
                title={'All Standings'}
                subTitle={`Total points accumulated until gameweek ${selectedGameweek}`}
            />
            {divisions
                .sort((a, b) => (a.order < b.order ? -1 : 1))
                .map((division) => (
                    <PositionPointsTable
                        key={division.id}
                        layout="plain"
                        teams={standingsData[division.id] || []}
                        pointsSource="seasonPoints"
                        title={<Link to={`/leagues/${division.id}`}>{division.label}</Link>}
                        showRankChange={false}
                        selectedGameweek={selectedGameweek}
                        divisionId={division.id}
                    />
                ))}
        </div>
    );
};
