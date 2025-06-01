import { useState, useMemo } from "react";
import styles from './player-stats-table.module.css';
import { PointsBreakdownTooltip } from './points-breakdown-tooltip';
import type { EnhancedPlayerData } from "../types";
import { isStatRelevant } from '../lib/is-stat-relevant';

interface PlayerStatsTableProps {
    players: EnhancedPlayerData[];
    teams: Record<number, string>;
    positions: Record<string, string>;
}

type SortField = 'web_name' | 'team_name' | 'draft.position' | 'draft.pointsTotal' | 'now_cost' | 'form';
type SortDirection = 'asc' | 'desc';

// Helper function to get nested value by dot notation
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Updated sort function
const sorter = (sortField, sortDirection) => (a, b) => {
    let aValue = getNestedValue(a, sortField);
    let bValue = getNestedValue(b, sortField);

    // Handle numeric values
    if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Handle string values
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    if (sortDirection === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
    }
};

export function PlayerStatsTable({ players, teams, positions }: PlayerStatsTableProps) {
    const [nameFilter, setNameFilter] = useState('');
    const [positionFilter, setPositionFilter] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [sortField, setSortField] = useState<SortField>('draft.pointsTotal');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Filter and sort players
    const filteredPlayers = useMemo(() => {
        let filtered = players.filter(player => {
            const matchesName = nameFilter === '' ||
                player.web_name.toLowerCase().includes(nameFilter.toLowerCase()) ||
                `${player.first_name} ${player.second_name}`.toLowerCase().includes(nameFilter.toLowerCase());

            const matchesPosition = positionFilter === '' || player.draft.position === positionFilter;
            const matchesTeam = teamFilter === '' || player.team_name === teamFilter;

            return matchesName && matchesPosition && matchesTeam;
        });

        // Sort players
        filtered.sort(sorter(sortField, sortDirection));

        return filtered;
    }, [players, nameFilter, positionFilter, teamFilter, sortField, sortDirection]);


    // Helper function to format stat value
    const formatStatValue = (value: number, stat: string, position: string): string => {
        if (!isStatRelevant(stat, position)) {
            return '-';
        }
        return value.toString();
    };
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    return (
        <div className={styles.container}>
            {/* Filters */}
            <div className={styles.filtersContainer}>
                <div className={styles.filterGroup}>
                    <label htmlFor="nameFilter" className={styles.filterLabel}>
                        Search Player
                    </label>
                    <input
                        id="nameFilter"
                        type="text"
                        placeholder="Search by name..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className={styles.filterInput}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label htmlFor="positionFilter" className={styles.filterLabel}>
                        Position
                    </label>
                    <select
                        id="positionFilter"
                        value={positionFilter}
                        onChange={(e) => setPositionFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">All Positions</option>
                        {Object.keys(positions).map(position => (
                            <option key={position} value={position}>{position}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label htmlFor="teamFilter" className={styles.filterLabel}>
                        Team
                    </label>
                    <select
                        id="teamFilter"
                        value={teamFilter}
                        onChange={(e) => setTeamFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">All Teams</option>
                        {Object.keys(teams).map(team => (
                            <option key={team} value={team}>{team}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.resultsCount}>
                    Showing {filteredPlayers.length} of {players.length} players
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th
                            onClick={() => handleSort('draft.position')}
                            className={styles.sortableHeader}
                        >
                            Pos {getSortIcon('draft.position')}
                        </th>
                        <th
                            onClick={() => handleSort('web_name')}
                            className={styles.sortableHeader}
                        >
                            Player {getSortIcon('web_name')}
                        </th>
                        <th
                            onClick={() => handleSort('team_name')}
                            className={styles.sortableHeader}
                        >
                            Team {getSortIcon('team_name')}
                        </th>
                        <th
                            onClick={() => handleSort('form')}
                            className={styles.sortableHeader}
                        >
                            Form {getSortIcon('form')}
                        </th>
                        <th
                            onClick={() => handleSort('now_cost')}
                            className={styles.sortableHeader}
                        >
                            Price {getSortIcon('now_cost')}
                        </th>
                        <th className={styles.statHeader}>Min</th>
                        <th className={styles.statHeader}>Goals</th>
                        <th className={styles.statHeader}>Assists</th>
                        <th className={styles.statHeader}>CS</th>
                        <th className={styles.statHeader}>Conceded</th>
                        <th className={styles.statHeader}>Pen Saved</th>
                        <th className={styles.statHeader}>YC</th>
                        <th className={styles.statHeader}>RC</th>
                        <th className={styles.statHeader}>Bonus</th>
                        <th className={styles.statHeader}>Saves</th>
                        <th
                            onClick={() => handleSort('draft.pointsTotal')}
                            className={`${styles.sortableHeader} ${styles.customPoints}`}
                        >
                            Custom Pts {getSortIcon('draft.pointsTotal')}
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredPlayers.map((player) =>  (
                        <tr key={player.id} className={styles.playerRow}>
                            <td className={`${styles.position} ${styles[player.draft.position.toLowerCase()]}`}>
                                {player.draft.position}
                            </td>
                            <td className={styles.playerName}>
                                <div>
                                    <div className={styles.webName}>{player.web_name}</div>
                                    <div className={styles.fullName}>
                                        {player.first_name} {player.second_name}
                                    </div>
                                </div>
                            </td>
                            <td className={styles.teamName}>{player.team_name}</td>
                            <td className={styles.form}>{player.form}</td>
                            <td className={styles.price}>£{(player.now_cost / 10).toFixed(1)}m</td>
                            <td className={styles.stat}>{player.minutes}</td>
                            <td className={styles.stat}>{player.goals_scored}</td>
                            <td className={styles.stat}>{player.assists}</td>
                            <td className={styles.stat}>{formatStatValue(player.clean_sheets, 'clean_sheets', player.draft.position)}</td>
                            <td className={styles.stat}>{formatStatValue(player.goals_conceded, 'goals_conceded', player.draft.position)}</td>
                            <td className={styles.stat}>{formatStatValue(player.penalties_saved, 'penalties_saved', player.draft.position)}</td>
                            <td className={styles.stat}>{player.yellow_cards}</td>
                            <td className={styles.stat}>{player.red_cards}</td>
                            <td className={styles.stat}>{formatStatValue(player.bonus, 'bonus', player.draft.position)}</td>
                            <td className={styles.stat}>{formatStatValue(player.saves, 'saves', player.draft.position)}</td>
                            <td className={styles.customPoints}>
                                <PointsBreakdownTooltip player={player}>
                                    <span className={styles.customPointsValue}>
                                      {player.draft.pointsTotal}
                                    </span>
                                </PointsBreakdownTooltip>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
