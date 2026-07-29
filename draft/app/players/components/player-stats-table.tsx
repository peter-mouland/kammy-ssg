/* Location: app/players/components/player-stats-table.tsx */

import { useMemo } from 'react';
import { Link } from 'react-router';
import { PlayerSummary } from '../../_shared/components/player';
import { Table, type TableColumn } from '../../_shared/components/table';
import { useTableFilters } from '../../_shared/hooks/use-table-filters';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { fuzzyStringMatch } from '../../_shared/lib/fuzzy-string-match';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import { getPlayerPosition } from '../../draft/lib/draft-rules';
import { PointsBreakdownTooltip } from '../../scoring';
import { getPositionDisplayName, isStatRelevant } from '../../scoring/lib';
import { sortPositions } from '../../teams/lib/sorting-utils';
import { WishlistButton, WishlistTags } from '../../wishlist';
import styles from './player-stats-table.module.css';
import { PlayersFilters } from './players-filters';

interface PlayerStatsTableProps {
    players: EnhancedPlayerData[];
    teamsByCode: Record<number, FplTeam>;
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

export function PlayerStatsTable({ players, teamsByCode }: PlayerStatsTableProps) {
    // URL-synced filters for persistence - updated to handle arrays
    const { filters, setFilter, resetFilters, isUpdating } = useTableFilters({
        defaultFilters: {
            search: '',
            positions: '', // Will be comma-separated string in URL
            teams: '', // Will be comma-separated string in URL
            status: '', // Will be comma-separated string in URL
        },
        debounceMs: 600,
    });

    // Convert URL string filters to arrays for multi-select
    const selectedPositions = useMemo(() => {
        if (!filters.positions || filters.positions === '') return [];
        return filters.positions.split(',').filter(Boolean);
    }, [filters.positions]);

    const selectedTeams = useMemo(() => {
        if (!filters.teams || filters.teams === '') return [];
        return filters.teams.split(',').filter(Boolean);
    }, [filters.teams]);

    // Generate filter options
    const positionOptions = useMemo(() => {
        const positions = sortPositions(Array.from(new Set(players.map((p) => getPlayerPosition(p))))).map((pos) => ({
            id: pos,
            label: getPositionDisplayName(pos),
            count: players.filter((p) => getPlayerPosition(p) === pos).length,
        }));
        return positions;
    }, [players]);

    const teamOptions = useMemo(() => {
        const teamCounts = players.reduce(
            (acc, player) => {
                acc[player.team_code] = (acc[player.team_code] || 0) + 1;
                return acc;
            },
            {} as Record<number, number>,
        );

        return Array.from(new Set(players.map((p) => p.team_code)))
            .sort((a, b) => (teamsByCode[a].name || '').localeCompare(teamsByCode[b].name || ''))
            .map((teamCode) => ({
                id: teamCode.toString(),
                label: teamsByCode[teamCode].name || `Team ${teamCode}`,
                count: teamCounts[teamCode] || 0,
            }));
    }, [players, teamsByCode]);

    // Handle multi-select changes
    const handlePositionsChange = (positions: string[]) => {
        setFilter('positions', positions.length > 0 ? positions.join(',') : undefined);
    };

    const handleTeamsChange = (teams: string[]) => {
        setFilter('teams', teams.length > 0 ? teams.join(',') : undefined);
    };

    const handleSearchChange = (search: string) => {
        setFilter('search', search || undefined);
    };

    // Filter players based on current filters
    const filteredPlayers = useMemo(() => {
        return players.filter((player) => {
            const playerName = formatPlayerName(player, 'full').toLowerCase();
            const teamName = teamsByCode[player.team_code].name?.toLowerCase() || '';
            const searchMatch =
                !filters.search ||
                fuzzyStringMatch(playerName, filters.search) ||
                fuzzyStringMatch(teamName, filters.search);

            // Position filter (multi-select)
            const positionMatch =
                selectedPositions.length === 0 || selectedPositions.includes(getPlayerPosition(player));

            // Team filter (multi-select)
            const teamMatch = selectedTeams.length === 0 || selectedTeams.includes(player.team_code.toString());

            return searchMatch && positionMatch && teamMatch;
        });
    }, [players, teamsByCode, filters.search, selectedPositions, selectedTeams]);

    // Define table columns using the EXACT same pattern as league-standings
    const columns: TableColumn<EnhancedPlayerData>[] = [
        {
            key: 'name',
            header: 'Player',
            accessor: (player) => formatPlayerName(player, 'web'),
            sortable: true,
            fixed: true,
            render: (_, player) => {
                return <PlayerSummary player={player} teamsByCode={teamsByCode} />;
            },
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
            key: 'apps',
            header: 'Mins',
            accessor: (player) => player.draft?.pointsBreakdown.appearance.stat || 0,
            sortable: true,
            variant: 'numeric',
            render: (stat, _player) => stat,
        },
        {
            key: 'goals',
            header: (
                <div>
                    <span className={styles.smallScreen}>Gls</span>
                    <span className={styles.largeScreen}>Goals</span>
                </div>
            ),
            accessor: (player) => player.draft?.pointsBreakdown.goals.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, _player) => stat,
        },
        {
            key: 'assists',
            header: (
                <div>
                    <span className={styles.smallScreen}>Asts</span>
                    <span className={styles.largeScreen}>Assists</span>
                </div>
            ),
            accessor: (player) => player.draft?.pointsBreakdown.assists.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, _player) => stat,
        },
        {
            key: 'cleanSheets',
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
            key: 'penaltiesSaved',
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
            key: 'yellowCards',
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
            accessor: (player) => player.draft?.pointsBreakdown.yellowCards.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, _player) => stat,
        },
        {
            key: 'redCards',
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
            accessor: (player) => player.draft?.pointsBreakdown.redCards.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, _player) => stat,
        },
        {
            key: 'bonus',
            header: (
                <div>
                    <span className={styles.smallScreen} title={'Bonus'}>
                        B
                    </span>
                    <span className={styles.largeScreen}>Bonus</span>
                </div>
            ),
            accessor: (player) => player.draft?.pointsBreakdown.bonus.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, _player) => stat,
        },
        {
            key: 'defensiveContribution',
            header: (
                <div>
                    <span className={styles.smallScreen} title={'Defensive Contribution'}>
                        DC
                    </span>
                    <span className={styles.largeScreen}>
                        Def.
                        <br />
                        Con.
                    </span>
                </div>
            ),
            accessor: (player) => player.draft?.pointsBreakdown.defensiveContribution?.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, _player) => stat,
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
            {/* Multi-Select Filters */}
            <PlayersFilters
                searchTerm={filters.search || ''}
                onSearchChange={handleSearchChange}
                positionOptions={positionOptions}
                selectedPositions={selectedPositions}
                onPositionsChange={handlePositionsChange}
                teamOptions={teamOptions}
                selectedTeams={selectedTeams}
                onTeamsChange={handleTeamsChange}
                onReset={resetFilters}
                isUpdating={isUpdating}
            />

            {/* Results count */}
            <div className={styles.resultsCount}>
                Showing {filteredPlayers.length} of {players.length} players
                {(selectedPositions.length > 0 || selectedTeams.length > 0) && (
                    <span className={styles.filterInfo}>
                        {' '}
                        (filtered by{' '}
                        {[
                            selectedPositions.length > 0 &&
                                `${selectedPositions.length} position${selectedPositions.length > 1 ? 's' : ''}`,
                            selectedTeams.length > 0 &&
                                `${selectedTeams.length} team${selectedTeams.length > 1 ? 's' : ''}`,
                        ]
                            .filter(Boolean)
                            .join(' and ')}
                        )
                    </span>
                )}
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
