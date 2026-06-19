/* Location: app/transfers/components/player-out-selector.tsx */

import { Table, type TableColumn } from '../../_shared/components/table';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { PlayerSummary } from '../../players/components/player';
import { PointsBreakdownTooltip } from '../../scoring/components/points-breakdown-tooltip';
import { isStatRelevant } from '../../scoring/lib';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { RosterPlayer, TeamRoster } from '../../teams/types/team-types';
import type { TransferType } from '../types/transfer-types';
import styles from './player-out-selector.module.css';

interface PlayerOutSelectorProps {
    roster: TeamRoster;
    selectedPlayer: RosterPlayer | null;
    onPlayerChange: (player: RosterPlayer | null) => void;
    transferType: TransferType;
    playersByCode: Record<number, EnhancedPlayerData>;
    teamsByCode: Record<number, FplTeam>;
}

export function PlayerOutSelector({
    teamsByCode,
    playersByCode,
    roster,
    selectedPlayer,
    onPlayerChange,
    transferType,
}: PlayerOutSelectorProps) {
    const rosterPlayersByCode: Record<number, RosterPlayer> = {};
    const allRosterPlayers = Object.values(roster).map(({ player }) => {
        rosterPlayersByCode[player.playerCode] = player;
        return playersByCode[player.playerCode];
    });

    const handlePlayerClick = (player: EnhancedPlayerData) => {
        if (selectedPlayer?.playerCode === player.code) {
            onPlayerChange(null);
        } else {
            onPlayerChange(rosterPlayersByCode[player.code]);
        }
    };
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
            render: (stat, _player) => stat,
        },
        {
            key: 'goals',
            header: <span title={'Goals'}>Gls</span>,
            accessor: (player) => player.draft?.pointsBreakdown.goals.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, _player) => stat,
        },
        {
            key: 'assists',
            header: <span title={'Assists'}>Asts</span>,
            accessor: (player) => player.draft?.pointsBreakdown.assists.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, _player) => stat,
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
            render: (stat, _player) => stat,
        },
        {
            key: 'redCards',
            header: <span title={'Red Cards'}>RC</span>,
            accessor: (player) => player.draft?.pointsBreakdown.redCards.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, _player) => stat,
        },
        {
            key: 'bonus',
            header: <span title={'Bonus'}>B</span>,
            accessor: (player) => player.draft?.pointsBreakdown.bonus.stat || 0,
            sortable: true,
            align: 'center',
            variant: 'numeric',
            render: (stat, _player) => stat,
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
    ];

    return (
        <div className={styles.playerOutSelector}>
            <div className={styles.selectorHeader}>
                <h3 className={styles.selectorTitle}>Transfer Out</h3>
                <p className={styles.selectorDescription}>Select a player from your current squad</p>
            </div>

            {/* Player List */}
            <div className={styles.playerList}>
                <Table
                    data={allRosterPlayers}
                    columns={columns}
                    onRowClick={(player) => handlePlayerClick(player)}
                    getRowProps={(player) => {
                        return {
                            className: `${styles.playerItem} ${selectedPlayer?.playerCode === player.code ? styles.selected : ''}`,
                        };
                    }}
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
                        <span className={styles.summaryLabel}>Selected:</span>
                        <span className={styles.summaryPlayer}>
                            <strong>{selectedPlayer.playerName}</strong>
                            <span className={styles.summaryDetails}>
                                {' '}
                                {selectedPlayer.playerPosition} •{' '}
                                {teamsByCode[playersByCode[selectedPlayer.playerCode].team_code].name}
                            </span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
