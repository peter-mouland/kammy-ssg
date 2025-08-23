/* Location: app/players/players.page.tsx */

// app/routes/players.tsx
import { useLoaderData } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import { ScoringInfo } from '../scoring/components/scoring-info';
import { PlayerStatsTable } from './components/player-stats-table';
import type { PlayerStatsData } from './types/player-types';

export const PlayersPage = () => {
    const { players, teamsByCode } = useLoaderData<PlayerStatsData>();

    return (
        <div>
            <PageHeader
                title={'Player Statistics'}
                subTitle={`Comprehensive stats for all ${players.length} Premier League players with custom scoring`}
            />

            <ScoringInfo />

            <PlayerStatsTable players={players} teamsByCode={teamsByCode} />
        </div>
    );
};
