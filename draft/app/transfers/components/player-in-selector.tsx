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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<string>('all');
    const [selectedTeam, setSelectedTeam] = useState<string>('all');
    const [showOnlyEligible, setShowOnlyEligible] = useState(false);

    // URL-synced filters for persistence - updated to handle arrays
    const { filters, setFilter, resetFilters, isUpdating } = useTableFilters({
        defaultFilters: {
            search: '',
            positions: '', // Will be comma-separated string in URL
            teams: '', // Will be comma-separated string in URL
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

    const getPlayerEligibility = (player: EnhancedPlayerData) => {
        if (!playerOut) {
            return {
                isEligible: true,
                reason: '',
            };
        }
        const mockTransfer: ProcessedTransfer = {
            playerOut: validationContext.fplPlayersByCode[playerOut.playerCode],
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

    // Filter and sort players
    const filteredPlayers = useMemo(() => {
        let filtered = availablePlayers;

        // Search filter
        filtered = filtered.filter((player) => {
            const searchMatch =
                !searchTerm ||
                fuzzyStringMatch(player.web_name, searchTerm) ||
                fuzzyStringMatch(player.first_name, searchTerm) ||
                fuzzyStringMatch(player.second_name, searchTerm);

            const positionMatch =
                selectedPositions.length === 0 || selectedPositions.includes(getPlayerPosition(player));

            // Team filter (multi-select)
            const teamMatch = selectedTeams.length === 0 || selectedTeams.includes(player.team_code.toString());

            // Eligibility filter
            const isEligible = showOnlyEligible ? getPlayerEligibility(player).isEligible : true;

            return searchMatch && positionMatch && teamMatch && isEligible;
        });

        // Add eligibility info to each player
        return filtered.map((player) => ({
            ...player,
            eligibility: getPlayerEligibility(player),
            ownership: getPlayerOwnership(player, ownedPlayersByCode),
        }));
    }, [availablePlayers, searchTerm, selectedPosition, selectedTeam, showOnlyEligible, transferType, playerOut]);

    const positions = useMemo(() => {
        const positionSet = new Set(availablePlayers.map((p) => p.draft?.position).filter(Boolean));
        return Array.from(positionSet).sort();
    }, [availablePlayers]);

    const teams = Object.keys(teamsByCode)
        .map((code) => teamsByCode[Number.parseInt(code, 10)])
        .sort((a, b) => (a.name < b.name ? -1 : 1));

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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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

                <label className={styles.checkboxLabel}>
                    Show only eligible
                    <br />
                    <input
                        type="checkbox"
                        checked={showOnlyEligible}
                        onChange={(e) => setShowOnlyEligible(e.target.checked)}
                        className={styles.checkbox}
                    />
                </label>
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
                <div className={styles.selectedPlayer}>
                    <div className={styles.selectedLabel}>Selected:</div>
                    <div className={styles.selectedInfo}>
                        <strong>{selectedPlayer.web_name}</strong>
                        <span className={styles.selectedDetails}>
                            {selectedPlayer.draft?.position} • {selectedPlayer.team_code}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
