// app/teams/components/all-teams-table.tsx
import type React from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { PlayerSummary } from '../../_shared/components/player';
import { Table, TableBadge, type TableColumn } from '../../_shared/components/table';
import { useTableFilters } from '../../_shared/hooks/use-table-filters';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { fuzzyStringMatch } from '../../_shared/lib/fuzzy-string-match';
import type { PlayerGameweekStatsData } from '../../_shared/types/performance-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import { isStatRelevant } from '../../scoring/lib';
import { compareByManagerThenPosition } from '../lib/sorting-utils';
import type { AllTeamsData, TeamFilters, TeamRowData } from '../types/team-view-types';
import { AllTeamsFilters } from './all-teams-filters';
import styles from './all-teams-table.module.css';

interface AllTeamsTableProps {
    teamsByCode: Record<number, FplTeam>;
    fplPlayersByCode: Record<number, EnhancedPlayerData>;
    allTeamsData: AllTeamsData;
    gameweek: number;
    viewMode: 'gameweek' | 'season';
}

let managerAlt = '';
let managerAltColor = 'transparent';

const positiveNegativeStyle = (stat: number) =>
    stat > 0 ? styles.positive : stat < 0 ? styles.negative : styles.neutral;

export const AllTeamsTable: React.FC<AllTeamsTableProps> = ({
    teamsByCode,
    fplPlayersByCode,
    allTeamsData,
    gameweek,
    viewMode,
}) => {
    // Updated to handle multi-select arrays
    const { filters, setFilter, resetFilters, isUpdating } = useTableFilters<TeamFilters>({
        defaultFilters: {
            search: '',
            managers: '', // Will be comma-separated string in URL
            positions: '', // Will be comma-separated string in URL
            loanStatuses: '', // Will be comma-separated string in URL
        },
        debounceMs: 600,
    });

    // Convert URL string filters to arrays for multi-select
    const selectedManagers = useMemo(() => {
        if (!filters.managers || filters.managers === '') return [];
        return filters.managers.split(',').filter(Boolean);
    }, [filters.managers]);

    const selectedPositions = useMemo(() => {
        if (!filters.positions || filters.positions === '') return [];
        return filters.positions.split(',').filter(Boolean);
    }, [filters.positions]);

    const selectedLoanStatuses = useMemo(() => {
        if (!filters.loanStatuses || filters.loanStatuses === '') return [];
        return filters.loanStatuses.split(',').filter(Boolean);
    }, [filters.loanStatuses]);

    // Generate filter options with counts
    const managerOptions = useMemo(() => {
        const managerCounts = allTeamsData.teams.reduce(
            (acc, team) => {
                acc[team.managerId] = (acc[team.managerId] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        );

        return allTeamsData.availableManagers.map((manager) => ({
            id: manager.id,
            label: `${manager.teamName} (${manager.name})`,
            count: managerCounts[manager.id] || 0,
        }));
    }, [allTeamsData]);

    const positionOptions = useMemo(() => {
        const positionCounts = allTeamsData.teams.reduce(
            (acc, team) => {
                const position = team.player.playerPosition;
                acc[position] = (acc[position] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        );

        return allTeamsData.availablePositions.map((position) => ({
            id: position,
            label: position.toUpperCase(),
            count: positionCounts[position] || 0,
        }));
    }, [allTeamsData]);

    const loanStatusOptions = useMemo(() => {
        const statusCounts = allTeamsData.teams.reduce(
            (acc, team) => {
                if (team.player.onLoanTo) {
                    acc['loaned-out'] = (acc['loaned-out'] || 0) + 1;
                } else if (team.player.onLoanFrom) {
                    acc['loaned-in'] = (acc['loaned-in'] || 0) + 1;
                } else {
                    acc.regular = (acc.regular || 0) + 1;
                }
                return acc;
            },
            {} as Record<string, number>,
        );

        return [
            { id: 'regular', label: 'Regular Players', count: statusCounts.regular || 0 },
            { id: 'loaned-out', label: 'Loaned Out', count: statusCounts['loaned-out'] || 0 },
            { id: 'loaned-in', label: 'Loaned In', count: statusCounts['loaned-in'] || 0 },
        ];
    }, [allTeamsData]);

    // Handle multi-select changes
    const handleManagersChange = (managers: string[]) => {
        setFilter('managers', managers.length > 0 ? managers.join(',') : undefined);
    };

    const handlePositionsChange = (positions: string[]) => {
        setFilter('positions', positions.length > 0 ? positions.join(',') : undefined);
    };

    const handleLoanStatusesChange = (statuses: string[]) => {
        setFilter('loanStatuses', statuses.length > 0 ? statuses.join(',') : undefined);
    };

    const handleSearchChange = (search: string) => {
        setFilter('search', search || undefined);
    };

    // Filter data based on current filters
    const filteredData = useMemo(() => {
        let filtered = allTeamsData.teams;

        // Manager filter (multi-select)
        if (selectedManagers.length > 0) {
            filtered = filtered.filter((team) => selectedManagers.includes(team.managerId));
        }

        // Position filter (multi-select)
        if (selectedPositions.length > 0) {
            filtered = filtered.filter((team) => selectedPositions.includes(team.player.playerPosition));
        }

        // Loan status filter (multi-select)
        if (selectedLoanStatuses.length > 0) {
            filtered = filtered.filter((team) => {
                const teamLoanStatus = team.player.onLoanTo
                    ? 'loaned-out'
                    : team.player.onLoanFrom
                      ? 'loaned-in'
                      : 'regular';
                return selectedLoanStatuses.includes(teamLoanStatus);
            });
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
    }, [
        allTeamsData.teams,
        selectedManagers,
        selectedPositions,
        selectedLoanStatuses,
        filters.search,
        teamsByCode,
        fplPlayersByCode,
    ]);

    // Define table columns
    const columns: TableColumn<TeamRowData>[] = [
        {
            key: 'player',
            header: 'Player',
            accessor: ({ player }) => player.playerName,
            sortable: true,
            fixed: true,

            onSort: (data: TeamRowData[], direction: 'asc' | 'desc') => {
                return [...data].sort((a, b) => {
                    const result = compareByManagerThenPosition(a, b);
                    return direction === 'desc' ? -result : result;
                });
            },
            render: (_, team) => (
                <Link to={`/players/${team.player.playerCode}`}>
                    <PlayerSummary
                        player={team.player}
                        fplPlayersByCode={fplPlayersByCode}
                        teamsByCode={teamsByCode}
                        // manager={team.managerInfo.userName}
                    />
                </Link>
            ),
        },
        {
            key: 'manager',
            header: 'User',
            // hideOnMobile: true,
            sortable: true,
            onSort: (data: TeamRowData[], direction: 'asc' | 'desc') => {
                return [...data].sort((a, b) => {
                    const result = compareByManagerThenPosition(a, b);
                    return direction === 'desc' ? -result : result;
                });
            },
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
            header: viewMode === 'gameweek' ? `GW${gameweek}` : 'Season',
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.points.total : positionSlot.season.points.total,
            align: 'center',
            render: (points, _team) => {
                return (
                    <span className={`${styles.points} ${points === 0 ? styles.negative : styles.positive}`}>
                        {points < 0 ? `-${points}` : points}
                    </span>
                );
            },
        },
        {
            key: 'stats.appearance',
            header: 'Mins',
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, _team) => {
                return (
                    <span className={`${styles.points} ${stats.appearance === 0 ? styles.negative : styles.positive}`}>
                        {stats.appearance < 0 ? `-${stats.appearance}` : stats.appearance}
                    </span>
                );
            },
        },
        {
            key: 'stats.goals',
            header: (
                <div>
                    <span className={styles.smallScreen}>Gls</span>
                    <span className={styles.largeScreen}>Goals</span>
                </div>
            ),
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, _team) => {
                return (
                    <span className={`${styles.points} ${positiveNegativeStyle(stats.goals)}`}>
                        {stats.goals < 0 ? `-${stats.goals}` : stats.goals}
                    </span>
                );
            },
        },
        {
            key: 'stats.assists',
            header: (
                <div>
                    <span className={styles.smallScreen}>Asts</span>
                    <span className={styles.largeScreen}>Assists</span>
                </div>
            ),
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, _team) => {
                return (
                    <span className={`${styles.points} ${positiveNegativeStyle(stats.assists)}`}>
                        {stats.assists < 0 ? `-${stats.assists}` : stats.assists}
                    </span>
                );
            },
        },
        {
            key: 'stats.cleanSheets',
            header: (
                <div>
                    <span className={styles.smallScreen} title={'Clean Sheets'}>
                        CS
                    </span>
                    <span className={styles.largeScreen}>
                        Clean
                        <br />
                        Sheets
                    </span>
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
                    <span className={`${styles.points} ${isRelevant && positiveNegativeStyle(stat)}`}>
                        {isRelevant && stat < 0 ? `-${stat}` : isRelevant ? stat : '-'}
                    </span>
                );
            },
        },
        {
            key: 'stats.penaltiesSaved',
            header: (
                <div>
                    <span className={styles.smallScreen} title={'Penalties Saved'}>
                        PS
                    </span>
                    <span className={styles.largeScreen}>
                        Pens
                        <br />
                        Saved
                    </span>
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
                        {isRelevant && stat < 0 ? `-${stat}` : isRelevant ? stat : '-'}
                    </span>
                );
            },
        },
        {
            key: 'stats.saves',
            header: (
                <div>
                    <span className={styles.smallScreen} title={'Saves'}>
                        S
                    </span>
                    <span className={styles.largeScreen}>Saves</span>
                </div>
            ),
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats.saves : positionSlot.season.stats.saves,
            align: 'center',
            render: (stat: number, team) => {
                const isRelevant = isStatRelevant('cleanSheets', team.player.playerPosition);
                return (
                    <span className={`${styles.points} ${isRelevant && positiveNegativeStyle(stat)}`}>
                        {isRelevant && stat < 0 ? `-${stat}` : isRelevant ? stat : '-'}
                    </span>
                );
            },
        },
        {
            key: 'stats.yellowCards',
            header: (
                <div>
                    <span className={styles.smallScreen} title={'Yellow Cards'}>
                        YC
                    </span>
                    <span className={styles.largeScreen}>
                        Yellow
                        <br />
                        Cards
                    </span>
                </div>
            ),
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, _team) => {
                return (
                    <span className={`${styles.points} ${stats.yellowCards === 0 ? styles.positive : styles.negative}`}>
                        {stats.yellowCards > 0 ? `${stats.yellowCards}` : stats.yellowCards}
                    </span>
                );
            },
        },
        {
            key: 'stats.redCards',
            header: (
                <div>
                    <span className={styles.smallScreen} title={'Red Cards'}>
                        RC
                    </span>
                    <span className={styles.largeScreen}>
                        Red
                        <br />
                        Cards
                    </span>
                </div>
            ),
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, _team) => {
                return (
                    <span className={`${styles.points} ${stats.redCards === 0 ? styles.positive : styles.negative}`}>
                        {stats.redCards > 0 ? `${stats.redCards}` : stats.redCards}
                    </span>
                );
            },
        },
        {
            key: 'stats.bonus',
            header: (
                <div>
                    <span className={styles.smallScreen} title={'Bonus'}>
                        B
                    </span>
                    <span className={styles.largeScreen}>Bonus</span>
                </div>
            ),
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, _team) => {
                return (
                    <span className={`${styles.points} ${positiveNegativeStyle(stats.bonus)}`}>
                        {stats.bonus < 0 ? `-${stats.bonus}` : stats.bonus}
                    </span>
                );
            },
        },
        {
            key: 'stats.defensiveContribution',
            header: (
                <div>
                    <span className={styles.smallScreen} title={'Defensive Contribution'}>
                        B
                    </span>
                    <span className={styles.largeScreen}>
                        Def.
                        <br />
                        Con.
                    </span>
                </div>
            ),
            sortable: true,
            accessor: ({ positionSlot }) =>
                viewMode === 'gameweek' ? positionSlot.gameweek.stats : positionSlot.season.stats,
            align: 'center',
            render: (stats: PlayerGameweekStatsData, _team) => {
                return (
                    <span className={`${styles.points} ${positiveNegativeStyle(stats.defensiveContribution)}`}>
                        {stats.defensiveContribution < 0
                            ? `-${stats.defensiveContribution}`
                            : stats.defensiveContribution}
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

    return (
        <div className={styles.allTeamsTable}>
            {/* Multi-Select Filters */}
            <AllTeamsFilters
                searchTerm={filters.search || ''}
                onSearchChange={handleSearchChange}
                managerOptions={managerOptions}
                selectedManagers={selectedManagers}
                onManagersChange={handleManagersChange}
                positionOptions={positionOptions}
                selectedPositions={selectedPositions}
                onPositionsChange={handlePositionsChange}
                loanStatusOptions={loanStatusOptions}
                selectedLoanStatuses={selectedLoanStatuses}
                onLoanStatusesChange={handleLoanStatusesChange}
                onReset={resetFilters}
                isUpdating={isUpdating}
            />
            {/* Results count */}
            <div className={styles.resultsCount}>
                Showing {filteredData.length} of {allTeamsData.teams.length} players
                {(selectedManagers.length > 0 || selectedPositions.length > 0 || selectedLoanStatuses.length > 0) && (
                    <span className={styles.filterInfo}>
                        {' '}
                        (filtered by{' '}
                        {[
                            selectedManagers.length > 0 &&
                                `${selectedManagers.length} manager${selectedManagers.length > 1 ? 's' : ''}`,
                            selectedPositions.length > 0 &&
                                `${selectedPositions.length} position${selectedPositions.length > 1 ? 's' : ''}`,
                            selectedLoanStatuses.length > 0 &&
                                `${selectedLoanStatuses.length} status${selectedLoanStatuses.length > 1 ? 'es' : ''}`,
                        ]
                            .filter(Boolean)
                            .join(', ')}
                        )
                    </span>
                )}
            </div>
            Table
            <Table
                data={filteredData}
                columns={columns}
                loading={false}
                sortable={true}
                size="default"
                onRowClick={(_team) => {
                    // Optional: Navigate to player detail page
                    // navigate(`/players/${team.playerCode}`);
                }}
                empty={{
                    title: 'No players found',
                    description: 'Try adjusting your filters to see more results',
                }}
                getRowProps={(team, _, sortKey) => {
                    let borderTop = '';
                    if (managerAlt !== team.managerId && (!sortKey || sortKey === 'manager' || sortKey === 'player')) {
                        managerAlt = team.managerId;
                        borderTop = '12px groove lightgrey';
                        if (managerAltColor === 'white') {
                            managerAltColor = 'var(--color-gray-100)';
                        } else {
                            managerAltColor = 'white';
                        }
                    }
                    const mBG = team.player.onLoanTo ? 'var(--color-gray-200)' : managerAltColor;
                    return { style: { background: mBG, borderTop } };
                }}
                getCellProps={(team) => {
                    const mBG = team.player.onLoanTo ? 'var(--color-gray-200)' : '';
                    return { style: { background: mBG } };
                }}
            />
        </div>
    );
};
