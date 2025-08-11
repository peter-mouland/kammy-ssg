/* Location: app/players/components/player-stats-table.tsx */

import { useMemo } from 'react';
import { Link } from 'react-router';
import { Table, type TableColumn } from '../../_shared/components/table';
import { TableFilters } from '../../_shared/components/table-filters';
import { useTableFilters } from '../../_shared/hooks/use-table-filters';
import { fuzzyStringMatch } from '../../_shared/lib/fuzzy-string-match';
import { getPlayerPosition } from '../../draft/lib/draft-rules';
import { PointsBreakdownTooltip } from '../../scoring/components/points-breakdown-tooltip';
import { getPositionDisplayName, isStatRelevant } from '../../scoring/lib';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import { WishlistButton } from '../../wishlist/components/wishlist-button';
import { WishlistTags } from '../../wishlist/components/wishlist-tags';
import { PlayerSummary } from './player';
import styles from './player-stats-table.module.css';

interface PlayerStatsTableProps {
    players: EnhancedPlayerData[];
    teams: Record<number, string>;
}

function formatPlayerName(player: EnhancedPlayerData, style: 'full' | 'short' | 'web' = 'full'): string {
    switch (style) {
        case 'full':
            return `${player.first_name} ${player.second_name}`;
        case 'short':
            return `${player.first_name[0]}. ${player.second_name}`;
        case 'web':
            return player.web_name || `${player.first_name} ${player.second_name}`;
        default:
            return `${player.first_name} ${player.second_name}`;
    }
}

export function PlayerStatsTable({ players, teams }: PlayerStatsTableProps) {
    // URL-synced filters for persistence - this handles ALL filter state
    const { filters, setFilter, resetFilters, isUpdating } = useTableFilters({
        defaultFilters: {
            search: '',
            position: '',
            team: '',
        },
        debounceMs: 300,
    });

    // Generate filter options
    const uniquePositions = Array.from(new Set(players.map((p) => getPlayerPosition(p))))
        .sort()
        .map((pos) => ({ value: pos, label: getPositionDisplayName(pos) }));

    const uniqueTeams = Array.from(new Set(players.map((p) => p.team_code)))
        .sort((a, b) => (teams[a] || '').localeCompare(teams[b] || ''))
        .map((teamCode) => ({ value: teamCode.toString(), label: teams[teamCode] || `Team ${teamCode}` }));

    // Filter players based on current filters
    const filteredPlayers = useMemo(() => {
        return players.filter((player) => {
            const playerName = formatPlayerName(player, 'full').toLowerCase();
            const teamName = teams[player.team_code]?.toLowerCase() || '';
            const searchMatch =
                !filters.search ||
                fuzzyStringMatch(playerName, filters.search) ||
                fuzzyStringMatch(teamName, filters.search);

            const positionMatch = !filters.position || getPlayerPosition(player) === filters.position;

            const teamMatch = !filters.team || player.team_code.toString() === filters.team;

            return searchMatch && positionMatch && teamMatch;
        });
    }, [players, teams, filters.search, filters.position, filters.team]);

    // Define table columns using the EXACT same pattern as league-standings
    const columns: TableColumn<EnhancedPlayerData>[] = [
        {
            key: 'name',
            header: 'Player',
            accessor: (player) => formatPlayerName(player, 'web'),
            sortable: true,
            render: (_, player) => {
                return <PlayerSummary player={player} teamsByCode={teams} />;
            },
        },
        {
            key: 'apps',
            header: 'Mins',
            accessor: (player) => player.draft?.pointsBreakdown.appearance.stat || 0,
            sortable: true,
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'goals',
            header: 'Goals',
            accessor: (player) => player.draft?.pointsBreakdown.goals.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'assists',
            header: 'Assists',
            accessor: (player) => player.draft?.pointsBreakdown.assists.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'cleanSheets',
            header: (
                <div>
                    Clean
                    <br />
                    Sheets
                </div>
            ),
            accessor: (player) =>
                isStatRelevant('cleanSheets', player.draft.position)
                    ? player.draft?.pointsBreakdown.cleanSheets.stat || 0
                    : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => (isStatRelevant('cleanSheets', player.draft.position) ? stat : '-'),
        },
        {
            key: 'goalsConceded',
            header: (
                <div>
                    Goals
                    <br />
                    Con.
                </div>
            ),
            accessor: (player) =>
                isStatRelevant('goalsConceded', player.draft.position)
                    ? player.draft?.pointsBreakdown.goalsConceded.stat || 0
                    : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => (isStatRelevant('goalsConceded', player.draft.position) ? stat : '-'),
        },
        {
            key: 'penaltiesSaved',
            header: (
                <div>
                    Pens
                    <br />
                    Saved
                </div>
            ),
            accessor: (player) =>
                isStatRelevant('penaltiesSaved', player.draft.position)
                    ? player.draft?.pointsBreakdown.penaltiesSaved.stat || 0
                    : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => (isStatRelevant('penaltiesSaved', player.draft.position) ? stat : '-'),
        },
        {
            key: 'saves',
            header: 'Saves',
            accessor: (player) =>
                isStatRelevant('saves', player.draft.position) ? player.draft?.pointsBreakdown.saves.stat || 0 : -1,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => (isStatRelevant('saves', player.draft.position) ? stat : '-'),
        },
        {
            key: 'yellowCards',
            header: (
                <div>
                    Y.
                    <br />
                    Cards
                </div>
            ),
            accessor: (player) => player.draft?.pointsBreakdown.yellowCards.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'redCards',
            header: (
                <div>
                    R.
                    <br />
                    Cards
                </div>
            ),
            accessor: (player) => player.draft?.pointsBreakdown.redCards.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'bonus',
            header: 'Bonus',
            accessor: (player) => player.draft?.pointsBreakdown.bonus.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'defensiveContribution',
            header: 'DC',
            accessor: (player) => player.draft?.pointsBreakdown.defensiveContribution?.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'points',
            header: 'Points',
            accessor: (player) => player.draft?.pointsTotal || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (_, player) => (
                <PointsBreakdownTooltip player={player}>{player.draft?.pointsTotal}</PointsBreakdownTooltip>
            ),
        },
        {
            key: 'wishlists',
            header: 'Wishlists',
            render: (_, player) => <WishlistTags playerCode={player.code} maxVisible={2} />,
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_, player) => (
                <div className={styles.actions}>
                    <WishlistButton player={player} size="small" showLabel={false} />
                    <Link to={`/players/${player.code}`} className={styles.viewLink}>
                        View
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            {/* Filters */}
            <TableFilters
                filters={{
                    search: filters.search || '',
                    status: filters.position || '',
                    category: filters.team || '',
                }}
                onFilterChange={(key, value) => {
                    if (key === 'search') setFilter('search', value || undefined);
                    if (key === 'status') setFilter('position', value || undefined);
                    if (key === 'category') setFilter('team', value || undefined);
                }}
                onFiltersChange={() => {}}
                onReset={resetFilters}
                isUpdating={isUpdating}
                statusOptions={uniquePositions.map((opt) => ({ value: opt.value, label: opt.label }))}
                categoryOptions={uniqueTeams.map((opt) => ({ value: opt.value, label: opt.label }))}
                showSearch={true}
                showStatus={true}
                showCategory={true}
                showSort={false}
            />

            {/* Results count */}
            <div className={styles.resultsCount}>
                Showing {filteredPlayers.length} of {players.length} players
            </div>

            {/* Table - using EXACT same pattern as league-standings */}
            <Table
                data={filteredPlayers}
                columns={columns}
                defaultSort={{ key: 'points', direction: 'desc' }}
                empty={{
                    icon: (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                    ),
                    title: 'No players found',
                    description: 'Try adjusting your search or filter criteria.',
                }}
            />
        </div>
    );
}
