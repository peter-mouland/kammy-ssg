// app/transfers/components/transfer-selector-stat-columns.tsx

import { PlayerSummary } from '../../_shared/components/player';
import type { TableColumn } from '../../_shared/components/table';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import { PointsBreakdownTooltip } from '../../scoring';
import { isStatRelevant } from '../../scoring/lib';

const STAT_COLUMN_WIDTH = '2rem';

export function getTransferSelectorStatColumns<T extends EnhancedPlayerData>(
    teamsByCode: Record<number, FplTeam>,
): TableColumn<T>[] {
    return [
        {
            key: 'name',
            header: 'Player',
            accessor: (player) => player.web_name,
            sortable: true,
            fixed: true,
            render: (_, player) => {
                return <PlayerSummary player={player} teamsByCode={teamsByCode} />;
            },
        },
        {
            key: 'points',
            header: 'Pts',
            accessor: (player) => player.draft?.pointsTotal || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (_, player) => (
                <PointsBreakdownTooltip player={player}>{player.draft?.pointsTotal}</PointsBreakdownTooltip>
            ),
        },
        {
            key: 'apps',
            header: <span title="Minutes">Min</span>,
            accessor: (player) => player.draft?.pointsBreakdown.appearance.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
        {
            key: 'goals',
            header: <span title="Goals">G</span>,
            accessor: (player) => player.draft?.pointsBreakdown.goals.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
        {
            key: 'assists',
            header: <span title="Assists">A</span>,
            accessor: (player) => player.draft?.pointsBreakdown.assists.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
        {
            key: 'cleanSheets',
            header: <span title="Clean Sheets">CS</span>,
            accessor: (player) =>
                isStatRelevant('cleanSheets', player.draft.position)
                    ? player.draft?.pointsBreakdown.cleanSheets.stat || 0
                    : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat, player) => (isStatRelevant('cleanSheets', player.draft.position) ? stat : '-'),
        },
        {
            key: 'penaltiesSaved',
            header: <span title="Penalties Saved">PS</span>,
            accessor: (player) =>
                isStatRelevant('penaltiesSaved', player.draft.position)
                    ? player.draft?.pointsBreakdown.penaltiesSaved.stat || 0
                    : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat, player) => (isStatRelevant('penaltiesSaved', player.draft.position) ? stat : '-'),
        },
        {
            key: 'saves',
            header: <span title="Saves">Sv</span>,
            accessor: (player) =>
                isStatRelevant('saves', player.draft.position) ? player.draft?.pointsBreakdown.saves.stat || 0 : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat, player) => (isStatRelevant('saves', player.draft.position) ? stat : '-'),
        },
        {
            key: 'goalsConceded',
            header: <span title="Goals Conceded">GC</span>,
            accessor: (player) =>
                isStatRelevant('goalsConceded', player.draft.position)
                    ? player.draft?.pointsBreakdown.goalsConceded.stat || 0
                    : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat, player) => (isStatRelevant('goalsConceded', player.draft.position) ? stat : '-'),
        },
        {
            key: 'yellowCards',
            header: <span title="Yellow Cards">YC</span>,
            accessor: (player) => player.draft?.pointsBreakdown.yellowCards.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
        {
            key: 'redCards',
            header: <span title="Red Cards">RC</span>,
            accessor: (player) => player.draft?.pointsBreakdown.redCards.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
        {
            key: 'bonus',
            header: <span title="Bonus">Bs</span>,
            accessor: (player) => player.draft?.pointsBreakdown.bonus.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
        {
            key: 'defensiveContribution',
            header: <span title="Defensive Contribution">DC</span>,
            accessor: (player) => player.draft?.pointsBreakdown.defensiveContribution?.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
    ];
}
