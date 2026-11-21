// app/transfers/components/transfer-selector-stat-columns.tsx

import { PlayerSummary } from '../../_shared/components/player';
import type { TableColumn } from '../../_shared/components/table';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import { isStatRelevant, PointsBreakdownTooltip } from '../../scoring';
import { compareByFixtureEase } from '../lib/fixture-ease';
import type { AvailabilityByCode } from '../lib/player-availability';
import type { UpcomingFixturesByTeamCode } from '../lib/upcoming-fixtures';
import { FixtureStrip } from './fixture-strip';

const STAT_COLUMN_WIDTH = '2rem';

/**
 * Image, position, name and club, plus FPL's injury or suspension icon for anyone in doubt.
 * Shared by every transfer table so they all match.
 */
export function playerColumn<T extends EnhancedPlayerData>(
    teamsByCode: Record<number, FplTeam>,
    availabilityByCode: AvailabilityByCode = {},
): TableColumn<T> {
    return {
        key: 'name',
        header: 'Player',
        accessor: (player) => player.web_name,
        sortable: true,
        fixed: true,
        render: (_, player) => {
            return (
                <PlayerSummary
                    player={player}
                    teamsByCode={teamsByCode}
                    availability={availabilityByCode[player.code]}
                />
            );
        },
    };
}

/** Season points, with the breakdown on hover. Shared by every transfer table. */
export function pointsColumn<T extends EnhancedPlayerData>(): TableColumn<T> {
    return {
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
    };
}

/**
 * The club's next three gameweeks, coloured by difficulty. Shared by every transfer table.
 * Sorting it ranks the runs by how easy they are; see `compareByFixtureEase` for the rules.
 */
export function upcomingFixturesColumn<T extends EnhancedPlayerData>(
    upcomingFixturesByTeamCode: UpcomingFixturesByTeamCode,
): TableColumn<T> {
    return {
        key: 'upcomingFixtures',
        header: (
            <span title="Fixtures in the next three gameweeks. Sort high to low to put the easiest run first">
                Next 3
            </span>
        ),
        sortable: true,
        onSort: (players, direction) => [...players].sort(compareByFixtureEase(upcomingFixturesByTeamCode, direction)),
        render: (_, player) => <FixtureStrip gameweeks={upcomingFixturesByTeamCode[player.team_code]} />,
    };
}

export function getTransferSelectorStatColumns<T extends EnhancedPlayerData>(
    teamsByCode: Record<number, FplTeam>,
    availabilityByCode: AvailabilityByCode = {},
    upcomingFixturesByTeamCode: UpcomingFixturesByTeamCode = {},
): TableColumn<T>[] {
    return [
        playerColumn<T>(teamsByCode, availabilityByCode),
        pointsColumn<T>(),
        // Straight after Pts so it is on screen without scrolling the stats sideways.
        upcomingFixturesColumn<T>(upcomingFixturesByTeamCode),
        {
            key: 'apps',
            header: <span title="Minutes">Min</span>,
            accessor: (player) => player.draft?.pointsBreakdown?.appearance?.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
        {
            key: 'goals',
            header: <span title="Goals">G</span>,
            accessor: (player) => player.draft?.pointsBreakdown?.goals?.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
        {
            key: 'assists',
            header: <span title="Assists">A</span>,
            accessor: (player) => player.draft?.pointsBreakdown?.assists?.stat || 0,
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
                player.draft?.position && isStatRelevant('cleanSheets', player.draft.position)
                    ? player.draft?.pointsBreakdown?.cleanSheets?.stat || 0
                    : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat, player) =>
                player.draft?.position && isStatRelevant('cleanSheets', player.draft.position) ? stat : '-',
        },
        {
            key: 'penaltiesSaved',
            header: <span title="Penalties Saved">PS</span>,
            accessor: (player) =>
                player.draft?.position && isStatRelevant('penaltiesSaved', player.draft.position)
                    ? player.draft?.pointsBreakdown?.penaltiesSaved?.stat || 0
                    : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat, player) =>
                player.draft?.position && isStatRelevant('penaltiesSaved', player.draft.position) ? stat : '-',
        },
        {
            key: 'saves',
            header: <span title="Saves">Sv</span>,
            accessor: (player) =>
                player.draft?.position && isStatRelevant('saves', player.draft.position)
                    ? player.draft?.pointsBreakdown?.saves?.stat || 0
                    : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat, player) =>
                player.draft?.position && isStatRelevant('saves', player.draft.position) ? stat : '-',
        },
        {
            key: 'goalsConceded',
            header: <span title="Goals Conceded">GC</span>,
            accessor: (player) =>
                player.draft?.position && isStatRelevant('goalsConceded', player.draft.position)
                    ? player.draft?.pointsBreakdown?.goalsConceded?.stat || 0
                    : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat, player) =>
                player.draft?.position && isStatRelevant('goalsConceded', player.draft.position) ? stat : '-',
        },
        {
            key: 'yellowCards',
            header: <span title="Yellow Cards">YC</span>,
            accessor: (player) => player.draft?.pointsBreakdown?.yellowCards?.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
        {
            key: 'redCards',
            header: <span title="Red Cards">RC</span>,
            accessor: (player) => player.draft?.pointsBreakdown?.redCards?.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
        {
            key: 'defensiveContribution',
            header: <span title="Defensive Contribution">DC</span>,
            accessor: (player) => player.draft?.pointsBreakdown?.defensiveContribution?.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            width: STAT_COLUMN_WIDTH,
            render: (stat) => stat,
        },
    ];
}
