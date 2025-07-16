// app/teams/components/all-teams-table.tsx
import type React from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { PositionBadge, Table, TableBadge, type TableColumn } from '../../_shared/components/table';
import { useTableFilters } from '../../_shared/hooks/use-table-filters';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { fuzzyStringMatch } from '../../_shared/lib/fuzzy-string-match';
import type { PlayerGameweekStatsData } from '../../players/types/player-types';
import { isStatRelevant } from '../../scoring/lib';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { AllTeamsTableProps, TeamFilters, TeamRowData } from '../types/team-view-types';
import styles from './all-teams-table.module.css';

const Player = ({
    teamsByCode,
    fplPlayersByCode,
    player,
}: {
    teamsByCode: Record<number, FplTeam>;
    fplPlayersByCode: Record<number, EnhancedPlayerData>;
    player: any;
}) => {
    const img = `${`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.playerCode}.png`}`;
    return (
        <>
            <div className={styles.player_cell}>
                <img src={img} loading="lazy" alt="" width={35} />
                <div className={styles.player_cell_details}>
                    <div className={styles.player_name}>{player.playerName}</div>
                    <div className={styles.player_details}>
                        <PositionBadge position={player.playerPosition || player.draft.position}>
                            {player.playerPosition || player.draft.position}
                        </PositionBadge>
                        <span className={styles.team}>
                            {teamsByCode[fplPlayersByCode[player.playerCode].team_code].name}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};

export const AllTeamsTable: React.FC<AllTeamsTableProps> = ({
    teamsByCode,
    fplPlayersByCode,
    allTeamsData,
    gameweek,
    viewMode,
}) => {
    const { filters, setFilter, resetFilters } = useTableFilters<TeamFilters>({
        defaultFilters: {
            manager: 'all',
            position: 'all',
            loanStatus: 'all',
            substitute: 'all',
            search: '',
        },
        debounceMs: 300,
    });

    // Filter data based on current filters
    const filteredData = useMemo(() => {
        let filtered = allTeamsData.teams;

        // Manager filter
        if (filters.manager && filters.manager !== 'all') {
            filtered = filtered.filter((team) => team.managerId === filters.manager);
        }

        // Position filter
        if (filters.position && filters.position !== 'all') {
            filtered = filtered.filter((team) => team.player.playerPosition === filters.position);
        }

        // Loan status filter
        if (filters.loanStatus && filters.loanStatus !== 'all') {
            switch (filters.loanStatus) {
                case 'regular':
                    filtered = filtered.filter((team) => !team.isOnLoan);
                    break;
                case 'loaned-out':
                    filtered = filtered.filter((team) => team.player.onLoanTo !== null);
                    break;
                case 'loaned-in':
                    filtered = filtered.filter((team) => team.player.onLoanFrom !== null);
                    break;
            }
        }

        // Substitute filter
        if (filters.substitute && filters.substitute !== 'all') {
            switch (filters.substitute) {
                case 'starters':
                    filtered = filtered.filter((team) => !team.player.isSub);
                    break;
                case 'subs':
                    filtered = filtered.filter((team) => team.player.isSub);
                    break;
            }
        }

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
                (team) =>
                    fuzzyStringMatch(team.player.playerName, searchLower) ||
                    fuzzyStringMatch(team.managerInfo.userName, searchLower) ||
                    fuzzyStringMatch(teamsByCode[fplPlayersByCode[team.player.playerCode].team_code].name, searchLower),
            );
        }

        return filtered;
    }, [allTeamsData.teams, filters]);

    // Define table columns
    const columns: TableColumn<TeamRowData>[] = [
        {
            key: 'player',
            header: 'Player',
            accessor: ({ player }) => player.playerName,
            sortable: false,
            render: (_, team) => (
                <Player player={team.player} fplPlayersByCode={fplPlayersByCode} teamsByCode={teamsByCode} />
            ),
        },
        {
            key: 'manager',
            header: 'Manager',
            // width: '100px',
            sortable: true,
            accessor: ({ managerId }) => managerId,
            render: (_, team) => (
                <div className={styles.managerCell}>
                    <Link to={`/teams/${team.managerId}?gameweek=${gameweek}`} className={styles.managerLink}>
                        <div className={styles.teamName}>{team.managerInfo.userName}</div>
                    </Link>
                </div>
            ),
        },
        {
            key: 'stats.appearance',
            header: 'Mins',
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, team) => {
                return (
                    <span className={`${styles.points} ${stats.appearance >= 0 ? styles.positive : styles.negative}`}>
                        {stats.appearance > 0 ? `+${stats.appearance}` : stats.appearance}
                    </span>
                );
            },
        },
        {
            key: 'stats.goals',
            header: 'Goals',
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, team) => {
                return (
                    <span className={`${styles.points} ${stats.goals >= 0 ? styles.positive : styles.negative}`}>
                        {stats.goals > 0 ? `+${stats.goals}` : stats.goals}
                    </span>
                );
            },
        },
        {
            key: 'stats.assists',
            header: 'Assists',
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, team) => {
                return (
                    <span className={`${styles.points} ${stats.assists >= 0 ? styles.positive : styles.negative}`}>
                        {stats.assists > 0 ? `+${stats.assists}` : stats.assists}
                    </span>
                );
            },
        },
        {
            key: 'stats.cleanSheets',
            // header: 'Clean Sheets',
            header: (
                <div>
                    Clean
                    <br />
                    Sheets
                </div>
            ),
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek'
                    ? positionSlot.gameweek.stats.cleanSheets
                    : positionSlot.season.stats.cleanSheets,
            align: 'center',
            render: (stat: number, team) => {
                const isRelevant = isStatRelevant('cleanSheets', team.player.playerPosition);
                return (
                    <span
                        className={`${styles.points} ${isRelevant && stat >= 0 ? styles.positive : isRelevant ? styles.negative : styles.neutral}`}
                    >
                        {isRelevant && stat > 0 ? `+${stat}` : isRelevant ? stat : '-'}
                    </span>
                );
            },
        },
        {
            key: 'stats.penaltiesSaved',
            header: (
                <div>
                    Pens.
                    <br />
                    Saved
                </div>
            ),
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek'
                    ? positionSlot.gameweek.stats.penaltiesSaved
                    : positionSlot.season.stats.penaltiesSaved,
            align: 'center',
            render: (stat: number, team) => {
                const isRelevant = isStatRelevant('penaltiesSaved', team.player.playerPosition);
                return (
                    <span
                        className={`${styles.points} ${isRelevant && stat >= 0 ? styles.positive : isRelevant ? styles.negative : styles.neutral}`}
                    >
                        {isRelevant && stat > 0 ? `+${stat}` : isRelevant ? stat : '-'}
                    </span>
                );
            },
        },
        {
            key: 'stats.saves',
            header: 'Saves',
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats.saves : positionSlot.season.stats.saves,
            align: 'center',
            render: (stat: number, team) => {
                const isRelevant = isStatRelevant('cleanSheets', team.player.playerPosition);
                return (
                    <span
                        className={`${styles.points} ${isRelevant && stat >= 0 ? styles.positive : isRelevant ? styles.negative : styles.neutral}`}
                    >
                        {isRelevant && stat > 0 ? `+${stat}` : isRelevant ? stat : '-'}
                    </span>
                );
            },
        },
        {
            key: 'stats.yellowCards',
            // header: 'Yellow Cards',
            header: (
                <div>
                    Y.
                    <br />
                    Cards
                </div>
            ),
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, team) => {
                return (
                    <span className={`${styles.points} ${stats.yellowCards === 0 ? styles.positive : styles.negative}`}>
                        {stats.yellowCards > 0 ? `${stats.yellowCards}` : stats.yellowCards}
                    </span>
                );
            },
        },
        {
            key: 'stats.redCards',
            // header: 'Red Cards',
            header: (
                <div>
                    R.
                    <br />
                    Cards
                </div>
            ),
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, team) => {
                return (
                    <span className={`${styles.points} ${stats.redCards === 0 ? styles.positive : styles.negative}`}>
                        {stats.redCards > 0 ? `${stats.redCards}` : stats.redCards}
                    </span>
                );
            },
        },
        {
            key: 'stats.bonus',
            header: 'Bonus',
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, team) => {
                return (
                    <span className={`${styles.points} ${stats.bonus > 0 ? styles.positive : styles.negative}`}>
                        {stats.bonus > 0 ? `+${stats.bonus}` : stats.bonus}
                    </span>
                );
            },
        },
        {
            key: 'points',
            header: viewMode === 'gameweek' ? `GW${gameweek} Pts` : 'Season Pts',
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.points.total : positionSlot.season.points.total,
            align: 'center',
            render: (points, team) => {
                return (
                    <span className={`${styles.points} ${points >= 0 ? styles.positive : styles.negative}`}>
                        {points > 0 ? `+${points}` : points}
                    </span>
                );
            },
        },
        {
            key: 'status',
            header: 'Status',
            align: 'center',
            render: (_, team) => (
                <div className={styles.statusCell}>
                    {team.player.isSub && <TableBadge variant="gray">SUB</TableBadge>}
                    {team.player.onLoanTo && <TableBadge variant="warning">Out</TableBadge>}
                    {team.player.onLoanFrom && <TableBadge variant="success">In</TableBadge>}
                </div>
            ),
        },
    ];

    // Create filter options
    const filterOptions = useMemo(
        () => ({
            managers: [
                { value: 'all', label: 'All Managers' },
                ...allTeamsData.availableManagers.map((manager) => ({
                    value: manager.id,
                    label: `${manager.teamName} (${manager.name})`,
                })),
            ],
            positions: [
                { value: 'all', label: 'All Positions' },
                ...allTeamsData.availablePositions.map((position) => ({
                    value: position,
                    label: position.toUpperCase(),
                })),
            ],
            loanStatus: [
                { value: 'all', label: 'All Players' },
                { value: 'regular', label: 'Regular Players' },
                { value: 'loaned-out', label: 'Loaned Out' },
                { value: 'loaned-in', label: 'Loaned In' },
            ],
            substitute: [
                { value: 'all', label: 'All Players' },
                { value: 'starters', label: 'Starters Only' },
                { value: 'subs', label: 'Substitutes Only' },
            ],
        }),
        [allTeamsData],
    );

    return (
        <div className={styles.allTeamsTable}>
            {/* Header with view mode toggle */}
            <div className={styles.tableHeader}>
                <div className={styles.tableTitle}>
                    <h3>Division Teams</h3>
                </div>
            </div>

            {/* Custom Filters */}
            <div className={styles.filtersContainer}>
                <div className={styles.filtersRow}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Search</label>
                        <input
                            type="text"
                            placeholder="Search players, managers, teams..."
                            value={filters.search || ''}
                            onChange={(e) => setFilter('search', e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Manager</label>
                        <select
                            value={filters.manager || 'all'}
                            onChange={(e) => setFilter('manager', e.target.value)}
                            className={styles.selectInput}
                        >
                            {filterOptions.managers.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Position</label>
                        <select
                            value={filters.position || 'all'}
                            onChange={(e) => setFilter('position', e.target.value)}
                            className={styles.selectInput}
                        >
                            {filterOptions.positions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Loan Status</label>
                        <select
                            value={filters.loanStatus || 'all'}
                            onChange={(e) => setFilter('loanStatus', e.target.value)}
                            className={styles.selectInput}
                        >
                            {filterOptions.loanStatus.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.filtersActions}>
                    <button type="button" onClick={resetFilters} className={styles.resetButton}>
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            <Table
                data={filteredData}
                columns={columns}
                loading={false}
                sortable={true}
                size="default"
                onRowClick={(team) => {
                    // Optional: Navigate to player detail page
                    // navigate(`/players/${team.playerCode}`);
                }}
                empty={{
                    title: 'No players found',
                    description: 'Try adjusting your filters to see more results',
                }}
            />
        </div>
    );
};
