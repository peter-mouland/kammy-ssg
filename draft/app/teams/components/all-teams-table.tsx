// app/teams/components/all-teams-table.tsx
import type React from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { PositionBadge, Table, TableBadge, type TableColumn } from '../../_shared/components/table';
import { useTableFilters } from '../../_shared/hooks/use-table-filters';
import type { AllTeamsTableProps, TeamFilters, TeamRowData } from '../types/team-view-types';
import styles from './all-teams-table.module.css';
import { PlayerCard } from './player-card';

export const AllTeamsTable: React.FC<AllTeamsTableProps> = ({
    allTeamsData,
    currentUser,
    division,
    gameweek,
    isCurrentGameweek,
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
                    team.player.playerName.toLowerCase().includes(searchLower) ||
                    team.managerInfo.userId.toLowerCase().includes(searchLower) ||
                    team.managerInfo.teamName.toLowerCase().includes(searchLower),
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
                <div className={styles.playerCell}>
                    <PlayerCard
                        player={{
                            ...team.player,
                            assignedAt: team.assignedAt,
                        }}
                        isSubstitute={team.player.isSub}
                        gameweek={gameweek}
                    />
                </div>
            ),
        },
        {
            key: 'position',
            header: 'Position',
            accessor: ({ player }) => player.playerPosition,
            sortable: true,
            align: 'center',
            render: (_, team) => (
                <PositionBadge position={team.player.playerPosition}>
                    {team.player.playerPosition.toUpperCase()}
                </PositionBadge>
            ),
        },
        {
            key: 'manager',
            header: 'Manager',
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
            key: 'stats',
            header: 'Key Stats',
            render: (_, team) => {
                const stats =
                    viewMode === 'gameweek' ? team.positionSlot.gameweek.stats : team.positionSlot.season.stats;
                return (
                    <div className={styles.statsCell}>
                        {stats.goals > 0 && (
                            <span className={styles.stat} title={'goals'}>
                                ⚽{stats.goals}
                            </span>
                        )}
                        {stats.assists > 0 && (
                            <span className={styles.stat} title={'assists'}>
                                🅰️{stats.assists}
                            </span>
                        )}
                        {stats.cleanSheets > 0 && (
                            <span className={styles.stat} title={'cleanSheets'}>
                                🛡️{stats.cleanSheets}
                            </span>
                        )}
                        {stats.appearance > 0 && (
                            <span className={styles.statMins} title={'minutes'}>
                                {stats.appearance}'
                            </span>
                        )}
                    </div>
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

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Role</label>
                        <select
                            value={filters.substitute || 'all'}
                            onChange={(e) => setFilter('substitute', e.target.value)}
                            className={styles.selectInput}
                        >
                            {filterOptions.substitute.map((option) => (
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
