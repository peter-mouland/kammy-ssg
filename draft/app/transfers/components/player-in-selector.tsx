// app/transfers/components/player-in-selector.tsx

import { useMemo, useState } from 'react';
import { MultiSelect } from '../../_shared/components/multi-select';
import { Table, type TableColumn } from '../../_shared/components/table';
import { useTableFilters } from '../../_shared/hooks/use-table-filters';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { fuzzyStringMatch } from '../../_shared/lib/fuzzy-string-match';
import { getPlayerPosition } from '../../draft/lib/draft-rules';
import { PlayerSummary } from '../../players/components/player';
import { PointsBreakdownTooltip } from '../../scoring/components/points-breakdown-tooltip';
import { getPositionDisplayName, isStatRelevant } from '../../scoring/lib';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import { sortPositions } from '../../teams/lib/sorting-utils';
import type { ManagerId, RosterPlayer } from '../../teams/types/team-types';
import { getPlayerOwnership } from '../lib/get-player-ownership';
import { getPlayerEligibilityFromValidators } from '../lib/player-eligibility-from-validators';
import type { OwnedPlayersByCode } from '../types/transfer-form-types';
import type { TransferRuleContext } from '../types/transfer-rule-types';
import type { ProcessedTransfer, TransferType } from '../types/transfer-types';
import styles from './player-in-selector.module.css';

interface PlayerInSelectorProps {
    availablePlayers: EnhancedPlayerData[];
    selectedPlayer: EnhancedPlayerData | null;
    onPlayerChange: (player: EnhancedPlayerData | null) => void;
    transferType: TransferType;
    playerOut: RosterPlayer | null;
    ownedPlayersByCode: OwnedPlayersByCode;
    teamsByCode: Record<FplTeam['code'], FplTeam>;
    validationContext: Omit<TransferRuleContext, 'transfer'>;
    managerId: ManagerId;
}

export function PlayerInSelector({
    availablePlayers,
    selectedPlayer,
    onPlayerChange,
    transferType,
    playerOut,
    ownedPlayersByCode,
    teamsByCode,
    managerId,
    validationContext,
}: PlayerInSelectorProps) {
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

    const selectedStatuses = useMemo(() => {
        if (!filters.status || filters.status === '') return [];
        return filters.status.split(',').filter(Boolean);
    }, [filters.status]);

    // Generate filter options
    const positionOptions = useMemo(() => {
        const positions = sortPositions(Array.from(new Set(availablePlayers.map((p) => getPlayerPosition(p))))).map(
            (pos) => ({
                id: pos,
                label: getPositionDisplayName(pos),
                count: availablePlayers.filter((p) => getPlayerPosition(p) === pos).length,
            }),
        );
        return positions;
    }, [availablePlayers]);

    const teamOptions = useMemo(() => {
        const teamCounts = availablePlayers.reduce(
            (acc, player) => {
                acc[player.team_code] = (acc[player.team_code] || 0) + 1;
                return acc;
            },
            {} as Record<number, number>,
        );

        return Array.from(new Set(availablePlayers.map((p) => p.team_code)))
            .sort((a, b) => (teamsByCode[a].name || '').localeCompare(teamsByCode[b].name || ''))
            .map((teamCode) => ({
                id: teamCode.toString(),
                label: teamsByCode[teamCode].name || `Team ${teamCode}`,
                count: teamCounts[teamCode] || 0,
            }));
    }, [availablePlayers, teamsByCode]);

    // Handle multi-select changes
    const onPositionsChange = (positions: string[]) => {
        setFilter('positions', positions.length > 0 ? positions.join(',') : undefined);
    };

    const onTeamsChange = (teams: string[]) => {
        setFilter('teams', teams.length > 0 ? teams.join(',') : undefined);
    };

    const onSearchChange = (search: string) => {
        setFilter('search', search || undefined);
    };

    const onStatusChange = (statuses: string[]) => {
        setFilter('status', statuses.length > 0 ? statuses.join(',') : undefined);
    };

    const getPlayerEligibility = (player: EnhancedPlayerData) => {
        const mockTransfer: ProcessedTransfer = {
            playerOut: playerOut ? validationContext.fplPlayersByCode[playerOut.playerCode] : null,
            playerIn: player,
            managerId,
            transferType,
            gameweekData: validationContext.gameweekData,
            id: `eligibility-check-${Date.now()}`,
            timestamp: new Date(),
            status: 'PENDING',
            comment: 'Eligibility check',
            onLoanTo: undefined,
            onLoanFrom: undefined,
        };
        return getPlayerEligibilityFromValidators({ ...validationContext, transfer: mockTransfer });
    };

    // NEW: Status filter options
    const statusOptions = useMemo(() => {
        const newPlayerCount = availablePlayers.filter((p) => p.draft.isNew).length;
        const options = [
            {
                id: 'eligible',
                label: 'Eligible',
                count: availablePlayers.filter((p) => getPlayerEligibility(p).isEligible).length,
            },
        ];

        if (newPlayerCount > 0) {
            options.push({
                id: 'new',
                label: 'New',
                count: newPlayerCount,
            });
        }

        return options;
    }, [availablePlayers]);

    // Filter and sort players
    const filteredPlayers = useMemo(() => {
        let filtered = availablePlayers;

        // Search filter
        filtered = filtered.filter((player) => {
            const searchMatch =
                !filters.search ||
                fuzzyStringMatch(player.web_name, filters.search) ||
                fuzzyStringMatch(player.first_name, filters.search) ||
                fuzzyStringMatch(player.second_name, filters.search);

            const positionMatch = !selectedPositions.length || selectedPositions.includes(getPlayerPosition(player));
            const teamMatch = !selectedTeams.length || selectedTeams.includes(player.team_code.toString());

            // status filter
            const isHidden = player.draft.isHidden;
            const newMatch = !selectedStatuses.includes('new') || player.draft.isNew === true;
            const eligibleMatch = !selectedStatuses.includes('eligible') || getPlayerEligibility(player).isEligible;
            const statusMatch = !selectedStatuses.length || (newMatch && eligibleMatch);

            return searchMatch && positionMatch && teamMatch && statusMatch && !isHidden;
        });

        // Add eligibility info to each player
        return filtered.map((player) => ({
            ...player,
            eligibility: getPlayerEligibility(player),
            ownership: getPlayerOwnership(player, ownedPlayersByCode),
        }));
    }, [availablePlayers, filters.positions, filters.search, filters.status, transferType, playerOut]);

    // Define table columns using the EXACT same pattern as league-standings
    const columns: TableColumn<EnhancedPlayerData>[] = [
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
            render: (stat, player) => stat,
        },
        {
            key: 'goals',
            header: <span title={'Goals'}>Gls</span>,
            accessor: (player) => player.draft?.pointsBreakdown.goals.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'assists',
            header: <span title={'Assists'}>Asts</span>,
            accessor: (player) => player.draft?.pointsBreakdown.assists.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'cleanSheets',
            header: <span title={'Clean Sheets'}>CS</span>,
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
            header: <span title={'Penalties Saved'}>PS</span>,
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
            header: <div title={'Goals Conceded'}>GC</div>,
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
            header: <span title={'Yellow Cards'}>YC</span>,
            accessor: (player) => player.draft?.pointsBreakdown.yellowCards.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'redCards',
            header: <span title={'Red Cards'}>RC</span>,
            accessor: (player) => player.draft?.pointsBreakdown.redCards.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'bonus',
            header: <span title={'Bonus'}>B</span>,
            accessor: (player) => player.draft?.pointsBreakdown.bonus.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, player) => stat,
        },
        {
            key: 'defensiveContribution',
            header: <span title={'Defensive Contribution'}>DC</span>,
            accessor: (player) => player.draft?.pointsBreakdown.defensiveContribution?.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat) => stat,
        },
        {
            key: 'status',
            header: 'Status',
            align: 'right',
            render: (_, player) => (
                <div className={styles.playerStats} style={{ float: 'right' }}>
                    <div className={styles.playerStatus}>
                        <span className={styles.eligibilityIcon}>{player.eligibility.icon}</span>
                        <div className={styles.statusText}>
                            <div className={styles.eligibilityReason}>{player.eligibility.reason}</div>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className={styles.playerSelector}>
            <label className={styles.label}>Player In</label>

            {/* Transfer Type Context */}
            {transferType === 'LOAN_START' && (
                <div className={styles.transferContext}>
                    <span className={styles.contextIcon}>🔄</span>
                    <span className={styles.contextText}>
                        Select a player to acquire (owned players will create loan requests)
                    </span>
                </div>
            )}

            {transferType === 'LOAN_END' && (
                <div className={styles.transferContext}>
                    <span className={styles.contextIcon}>🔚</span>
                    <span className={styles.contextText}>Select the player to return from loan</span>
                </div>
            )}

            {/* Filters */}
            <div className={styles.filters}>
                <input
                    type="text"
                    placeholder="Search players..."
                    value={filters.search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={styles.searchInput}
                />

                {/* Positions Filter */}
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Positions</label>
                    <MultiSelect
                        options={positionOptions}
                        selectedValues={selectedPositions}
                        onSelectionChange={onPositionsChange}
                        placeholder="positions"
                        className={styles.multiSelect}
                    />
                </div>

                {/* Teams Filter */}
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Teams</label>
                    <MultiSelect
                        options={teamOptions}
                        selectedValues={selectedTeams}
                        onSelectionChange={onTeamsChange}
                        placeholder="teams"
                        className={styles.multiSelect}
                        sortOptions={true}
                    />
                </div>

                {/* NEW: Status filter */}
                {statusOptions.length > 0 && (
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Status</label>
                        <MultiSelect
                            options={statusOptions}
                            selectedValues={selectedStatuses}
                            onSelectionChange={onStatusChange}
                            placeholder="Player Status"
                        />
                    </div>
                )}
            </div>

            {/* Results count */}
            <div className={styles.resultsCount}>
                Showing {filteredPlayers.length} of {availablePlayers.length} players
                {(selectedPositions.length > 0 || selectedTeams.length > 0 || selectedStatuses.length > 0) && (
                    <span className={styles.filterInfo}>
                        {' '}
                        (filtered by{' '}
                        {[
                            selectedPositions.length > 0 &&
                                `${selectedPositions.length} position${selectedPositions.length > 1 ? 's' : ''}`,
                            selectedTeams.length > 0 &&
                                `${selectedTeams.length} team${selectedTeams.length > 1 ? 's' : ''}`,
                            selectedStatuses.includes('new') && 'new players only',
                        ]
                            .filter(Boolean)
                            .join(', ')}
                        )
                    </span>
                )}
            </div>

            {/* Player List */}
            <div className={styles.playerList}>
                <Table
                    data={filteredPlayers}
                    columns={columns}
                    onRowClick={(player) => onPlayerChange(player)}
                    getRowProps={(player) => {
                        return {
                            className: `${styles.playerCard} ${selectedPlayer?.id === player.id ? styles.selected : ''} ${
                                player.eligibility.isEligible ? '' : styles.ineligible
                            }`,
                        };
                    }}
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

            {/* Selected Player Display */}
            {selectedPlayer && (
                <div className={styles.selectedSummary}>
                    <div className={styles.summaryHeader}>
                        <div className={styles.summaryLabel}>Selected:</div>
                        <div className={styles.summaryPlayer}>
                            <strong>{selectedPlayer.web_name}</strong>
                            <span className={styles.summaryDetails}>
                                {selectedPlayer.draft?.position} • {teamsByCode[selectedPlayer.team_code].name}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
