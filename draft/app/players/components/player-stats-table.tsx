import React, { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { WishlistButton } from '../../wishlist/components/wishlist-button';
import { WishlistTags } from '../../wishlist/components/wishlist-tags';
import { PointsBreakdownTooltip } from '../../scoring/components/points-breakdown-tooltip';
import { getPlayerPosition } from '../../draft/lib/draft-rules'; // todo: global game settings?
import { getPositionDisplayName } from '../../scoring/lib';
import type { EnhancedPlayerData } from '../../_shared/types';
import styles from './player-stats-table.module.css';

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
    const [sortField, setSortField] = useState<'name' | 'position' | 'points' | 'price' | 'team'>('points');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [positionFilter, setPositionFilter] = useState<string>('all');
    const [teamFilter, setTeamFilter] = useState<string>('all');

    // Filter and sort players
    const filteredAndSortedPlayers = useMemo(() => {
        let filtered = players.filter(player => {
            const playerName = formatPlayerName(player, 'full').toLowerCase();
            const teamName = teams[player.team_code]?.toLowerCase() || '';
            const searchMatch = !searchTerm ||
                playerName.includes(searchTerm.toLowerCase()) ||
                teamName.includes(searchTerm.toLowerCase());

            const positionMatch = positionFilter === 'all' ||
                getPlayerPosition(player) === positionFilter;

            const teamMatch = teamFilter === 'all' ||
                player.team_code.toString() === teamFilter;

            return searchMatch && positionMatch && teamMatch;
        });

        // Sort players
        filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case 'name':
                    aValue = formatPlayerName(a, 'full').toLowerCase();
                    bValue = formatPlayerName(b, 'full').toLowerCase();
                    break;
                case 'position':
                    aValue = getPositionDisplayName(getPlayerPosition(a));
                    bValue = getPositionDisplayName(getPlayerPosition(b));
                    break;
                case 'points':
                    aValue = a.draft?.pointsTotal || a.total_points || 0;
                    bValue = b.draft?.pointsTotal || b.total_points || 0;
                    break;
                case 'price':
                    aValue = a.now_cost;
                    bValue = b.now_cost;
                    break;
                case 'team':
                    aValue = teams[a.team_code] || '';
                    bValue = teams[b.team_code] || '';
                    break;
                default:
                    return 0;
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }

            const aStr = String(aValue || '');
            const bStr = String(bValue || '');

            if (sortDirection === 'asc') {
                return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
            } else {
                return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
            }
        });

        return filtered;
    }, [players, teams, searchTerm, positionFilter, teamFilter, sortField, sortDirection]);

    const handleSort = (field: typeof sortField) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const SortHeader = ({ field, children }: { field: typeof sortField; children: React.ReactNode }) => (
        <th
            className={styles.sortableHeader}
            onClick={() => handleSort(field)}
        >
            <div className={styles.headerContent}>
                {children}
                <div className={styles.sortIcons}>
                    <svg
                        className={`${styles.sortIcon} ${sortField === field && sortDirection === 'asc' ? styles.activeSortIcon : ''}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <svg
                        className={`${styles.sortIcon} ${sortField === field && sortDirection === 'desc' ? styles.activeSortIcon : ''}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        </th>
    );

    const uniquePositions = Array.from(new Set(players.map(p => getPlayerPosition(p))))
        .sort()
        .map(pos => ({ value: pos, label: getPositionDisplayName(pos) }));

    const uniqueTeams = Array.from(new Set(players.map(p => p.team_code)))
        .sort((a, b) => (teams[a] || '').localeCompare(teams[b] || ''))
        .map(teamCode => ({ value: teamCode.toString(), label: teams[teamCode] || `Team ${teamCode}` }));

    return (
        <div className={styles.container}>
            {/* Filters */}
            <div className={styles.filtersContainer}>
                <div className={styles.filtersGrid}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search players or teams..."
                            className={styles.filterInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Position</label>
                        <select
                            value={positionFilter}
                            onChange={(e) => setPositionFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Positions</option>
                            {uniquePositions.map(pos => (
                                <option key={pos.value} value={pos.value}>{pos.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Team</label>
                        <select
                            value={teamFilter}
                            onChange={(e) => setTeamFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Teams</option>
                            {uniqueTeams.map(team => (
                                <option key={team.value} value={team.value}>{team.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setPositionFilter('all');
                                setTeamFilter('all');
                            }}
                            className={styles.clearButton}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                <div className={styles.resultsCount}>
                    Showing {filteredAndSortedPlayers.length} of {players.length} players
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                    <tr>
                        <SortHeader field="name">Player</SortHeader>
                        <SortHeader field="position">Position</SortHeader>
                        <SortHeader field="team">Team</SortHeader>
                        <SortHeader field="price">Price</SortHeader>
                        <SortHeader field="points">Points</SortHeader>
                        <th className={styles.header}>Form</th>
                        <th className={styles.header}>Wishlists</th>
                        <th className={styles.header}>Actions</th>
                    </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                    {filteredAndSortedPlayers.map((player) => (
                        <PlayerRow key={player.id} player={player} teams={teams} />
                    ))}
                    </tbody>
                </table>
            </div>

            {filteredAndSortedPlayers.length === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 className={styles.emptyTitle}>No players found</h3>
                    <p className={styles.emptyMessage}>Try adjusting your search or filter criteria.</p>
                </div>
            )}
        </div>
    );
}

// PlayerRow component
interface PlayerRowProps {
    player: EnhancedPlayerData;
    teams: Record<number, string>;
}

function PlayerRow({ player, teams }: PlayerRowProps) {
    const position = getPlayerPosition(player);
    const playerPrice = player.now_cost / 10;
    const playerForm = parseFloat(player.form || '0');

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

    return (
        <tr className={styles.tableRow}>
            {/* Player Name */}
            <td className={styles.playerCell}>
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
            </td>

            {/* Position */}
            <td className={styles.cell}>
        <span
            className={styles.positionBadge}
            style={{ backgroundColor: getPositionColor(position) }}
        >
          {getPositionDisplayName(position)}
        </span>
            </td>

            {/* Team */}
            <td className={styles.cell}>
                <div className={styles.teamName}>
                    {teams[player.team_code] || `Team ${player.team_code}`}
                </div>
            </td>

            {/* Price */}
            <td className={styles.cell}>
                <div className={styles.price}>
                    £{playerPrice.toFixed(1)}m
                </div>
            </td>

            {/* Points */}
            <td className={styles.cell}>
                <div className={styles.points}>
                    <PointsBreakdownTooltip player={player}>
                        {player.draft.pointsTotal}
                    </PointsBreakdownTooltip>
                </div>
            </td>

            {/* Form */}
            <td className={styles.cell}>
        <span className={`${styles.formBadge} ${getFormColor(playerForm)}`}>
          {playerForm.toFixed(1)}
        </span>
            </td>

            {/* Wishlists */}
            <td className={styles.cell}>
                <WishlistTags playerId={player.id.toString()} maxVisible={2} />
            </td>

            {/* Actions */}
            <td className={styles.cell}>
                <div className={styles.actions}>
                    <WishlistButton player={player} size="small" showLabel={false} />
                    <Link
                        to={`/players/${player.id}`}
                        className={styles.viewLink}
                    >
                        View
                    </Link>
                </div>
            </td>
        </tr>
    );
}
