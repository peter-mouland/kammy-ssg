// app/routes/players.tsx
import { useLoaderData } from "react-router";
import { PlayerStatsTable } from "./components/player-stats-table";
import { ScoringInfo } from '../scoring/components/scoring-info';
import { PageHeader } from '../_shared/components/page-header';

export const PlayersPage = () => {
    const { players, teams, positions } = useLoaderData<typeof loader>();

    return (
        <div>
            <PageHeader
                title={"Player Statistics"}
                subTitle={`Comprehensive stats for all ${players.length} Premier League players with custom scoring`}
            />

            <ScoringInfo />

            <PlayerStatsTable players={players} teams={teams} positions={positions} />
        </div>
    );
}
