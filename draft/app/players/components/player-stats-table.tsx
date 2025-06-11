import React, { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { WishlistButton } from '../../wishlist/components/wishlist-button';
import { WishlistTags } from '../../wishlist/components/wishlist-tags';
import { PointsBreakdownTooltip } from '../../scoring/components/points-breakdown-tooltip';
import { getPlayerPosition } from '../../draft/lib/draft-rules';
import { getPositionDisplayName } from '../../scoring/lib';
import { Table, type TableColumn } from '../../_shared/components/table';
import type { EnhancedPlayerData } from '../../_shared/types';
import styles from './player-stats-table.module.css';
import { TableFilters } from '../../_shared/components/table-filters';
import { useTableFilters } from '../../_shared/hooks/use-table-filters';

interface PlayerStatsTableProps {
    players: EnhancedPlayerData[];
    teams: Record<number, string>;
    positions: Record<string, string>;
}

export function formatPlayerName(player: Player, style: 'full' | 'short' | 'web' = 'full'): string {
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

export function PlayerStatsTable({ players, teams, positions }: PlayerStatsTableProps) {
    // URL-synced filters for persistence - this handles ALL filter state
    const {
        filters,
        setFilter,
        resetFilters,
        isUpdating
    } = useTableFilters({
        defaultFilters: {
            search: '',
            position: '',
            team: ''
        },
        debounceMs: 300
    });

    // Generate filter options
    const uniquePositions = Array.from(new Set(players.map(p => getPlayerPosition(p))))
        .sort()
        .map(pos => ({ value: pos, label: getPositionDisplayName(pos) }));

    const uniqueTeams = Array.from(new Set(players.map(p => p.team_code)))
        .sort((a, b) => (teams[a] || '').localeCompare(teams[b] || ''))
        .map(teamCode => ({ value: teamCode.toString(), label: teams[teamCode] || `Team ${teamCode}` }));

    // Filter players based on current filters
    const filteredPlayers = useMemo(() => {
        return players.filter(player => {
            const playerName = formatPlayerName(player, 'full').toLowerCase();
            const teamName = teams[player.team_code]?.toLowerCase() || '';
            const searchMatch = !filters.search ||
                playerName.includes(filters.search.toLowerCase()) ||
                teamName.includes(filters.search.toLowerCase());

            const positionMatch = !filters.position ||
                getPlayerPosition(player) === filters.position;

            const teamMatch = !filters.team ||
                player.team_code.toString() === filters.team;

            return searchMatch && positionMatch && teamMatch;
        });
    }, [players, teams, filters.search, filters.position, filters.team]);

    // Helper functions for rendering
    const getFormColor = (form: number) => {
        if (form >= 4.5) return styles.formExcellent;
        if (form >= 3.5) return styles.formGood;
        if (form >= 2.5) return styles.formAverage;
        return styles.formPoor;
    };

    const getPositionColor = (pos: string) => {
        const colors = {
            gk: 'var(--color-emerald-500, #10b981)',
            cb: 'var(--color-blue-500, #3b82f6)',
            fb: 'var(--color-blue-500, #3b82f6)',
            mid: 'var(--color-violet-500, #8b5cf6)',
            wa: 'var(--color-amber-500, #f59e0b)',
            ca: 'var(--color-red-500, #ef4444)'
        };
        return colors[pos.toLowerCase()] || 'var(--color-gray-500, #6b7280)';
    };

    // Define table columns using the EXACT same pattern as league-standings
    const columns: TableColumn<EnhancedPlayerData>[] = [
        {
            key: 'name',
            header: 'Player',
            accessor: (player) => formatPlayerName(player, 'full'),
            sortable: true,
            render: (_, player) => {
                const position = getPlayerPosition(player);
                return (
                    <div className={styles.playerInfo}>
                        <div
                            className={styles.playerAvatar}
                            style={{ backgroundColor: getPositionColor(position) }}
                        >
                            {getPositionDisplayName(position)}
                        </div>
                        <div className={styles.playerDetails}>
                            <div className={styles.playerName}>
                                <Link
                                    to={`/players/${player.id}`}
                                    className={styles.playerNameLink}
                                >
                                    {formatPlayerName(player, 'full')}
                                </Link>
                            </div>
                            <div className={styles.playerWebName}>
                                {player.web_name}
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'position',
            header: 'Position',
            accessor: (player) => getPositionDisplayName(getPlayerPosition(player)),
            sortable: true,
            render: (_, player) => {
                const position = getPlayerPosition(player);
                return (
                    <span
                        className={styles.positionBadge}
                        style={{ backgroundColor: getPositionColor(position) }}
                    >
                        {getPositionDisplayName(position)}
                    </span>
                );
            }
        },
        {
            key: 'team',
            header: 'Team',
            accessor: (player) => teams[player.team_code] || `Team ${player.team_code}`,
            sortable: true,
            render: (_, player) => (
                <div className={styles.teamName}>
                    {teams[player.team_code] || `Team ${player.team_code}`}
                </div>
            )
        },
        {
            key: 'price',
            header: 'Price',
            accessor: 'now_cost',
            sortable: true,
            variant: 'numeric',
            render: (_, player) => {
                const playerPrice = player.now_cost / 10;
                return `£${playerPrice.toFixed(1)}m`;
            }
        },
        {
            key: 'points',
            header: 'Points',
            accessor: (player) => player.draft?.pointsTotal || player.total_points || 0,
            sortable: true,
            variant: 'numeric',
            render: (_, player) => (
                <PointsBreakdownTooltip player={player}>
                    {player.draft.pointsTotal}
                </PointsBreakdownTooltip>
            )
        },
        {
            key: 'form',
            header: 'Form',
            accessor: (player) => parseFloat(player.form || '0'),
            sortable: true,
            render: (_, player) => {
                const playerForm = parseFloat(player.form || '0');
                return (
                    <span className={`${styles.formBadge} ${getFormColor(playerForm)}`}>
                        {playerForm.toFixed(1)}
                    </span>
                );
            }
        },
        {
            key: 'wishlists',
            header: 'Wishlists',
            render: (_, player) => (
                <WishlistTags playerId={player.id.toString()} maxVisible={2} />
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_, player) => (
                <div className={styles.actions}>
                    <WishlistButton player={player} size="small" showLabel={false} />
                    <Link
                        to={`/players/${player.id}`}
                        className={styles.viewLink}
                    >
                        View
                    </Link>
                </div>
            )
        }
    ];

    return (
        <div className={styles.container}>
            {/* Filters */}
            <TableFilters
                filters={{
                    search: filters.search || '',
                    status: filters.position || '',
                    category: filters.team || ''
                }}
                onFilterChange={(key, value) => {
                    if (key === 'search') setFilter('search', value || undefined);
                    if (key === 'status') setFilter('position', value || undefined);
                    if (key === 'category') setFilter('team', value || undefined);
                }}
                onFiltersChange={() => {}}
                onReset={resetFilters}
                isUpdating={isUpdating}
                statusOptions={uniquePositions.map(opt => ({ value: opt.value, label: opt.label }))}
                categoryOptions={uniqueTeams.map(opt => ({ value: opt.value, label: opt.label }))}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    ),
                    title: 'No players found',
                    description: 'Try adjusting your search or filter criteria.'
                }}
            />
        </div>
    );
}
