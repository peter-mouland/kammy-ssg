/* Location: app/transfers/components/player-out-selector.tsx */

import { Table } from '../../_shared/components/table';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { RosterPlayer, TeamRoster } from '../../teams/types/team-types';
import type { TransferType } from '../types/transfer-types';
import styles from './player-out-selector.module.css';
import { getTransferSelectorStatColumns } from './transfer-selector-stat-columns';

interface PlayerOutSelectorProps {
    roster: TeamRoster;
    selectedPlayer: RosterPlayer | null;
    onPlayerChange: (player: RosterPlayer | null) => void;
    transferType: TransferType;
    playersByCode: Record<number, EnhancedPlayerData>;
    teamsByCode: Record<number, FplTeam>;
    embeddedInJourney?: boolean;
}

export function PlayerOutSelector({
    teamsByCode,
    playersByCode,
    roster,
    selectedPlayer,
    onPlayerChange,
    transferType,
    embeddedInJourney = false,
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
    const columns = getTransferSelectorStatColumns(teamsByCode);

    return (
        <div className={`${styles.playerOutSelector} ${embeddedInJourney ? styles.embeddedInJourney : ''}`}>
            {embeddedInJourney ? null : (
                <div className={styles.selectorHeader}>
                    <h3 className={styles.selectorTitle}>Transfer Out</h3>
                    <p className={styles.selectorDescription}>Select a player from your current squad</p>
                </div>
            )}

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
