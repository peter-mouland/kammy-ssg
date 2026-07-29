/* Location: app/players/players.page.tsx */

// app/routes/players.tsx
import { useLoaderData } from 'react-router';
import { GameweekSelector } from '../_shared/components/gameweek-selector';
import { PageHeader } from '../_shared/components/page-header';
import { ScoringInfo } from '../scoring';
import { PlayerStatsTable } from './components/player-stats-table';
import type { PlayerStatsData } from './types/player-types';

export const PlayersPage = () => {
    const { players, teamsByCode, currentGameweekData, selectedGameweekData, availableGameweeks, selectedGameweek } =
        useLoaderData<PlayerStatsData>();

    const isSeasonView = selectedGameweek === null || selectedGameweek === undefined;
    const subtitle = isSeasonView
        ? `Comprehensive stats for all ${players.length} Premier League players with custom scoring`
        : `Gameweek ${selectedGameweek} stats for all ${players.length} Premier League players`;

    return (
        <div>
            <PageHeader
                title={'Player Statistics'}
                subTitle={subtitle}
                actions={
                    currentGameweekData &&
                    selectedGameweekData &&
                    availableGameweeks && (
                        <GameweekSelector
                            currentGameweekData={currentGameweekData}
                            selectedGameweekData={isSeasonView ? currentGameweekData : selectedGameweekData}
                            availableGameweeks={availableGameweeks}
                            showSeasonOption
                            isSeasonSelected={isSeasonView}
                        />
                    )
                }
            />

            <ScoringInfo />

            <PlayerStatsTable players={players} teamsByCode={teamsByCode} />
        </div>
    );
};
