/* Location: app/transfers/components/player-out-selector.tsx */

import { useState } from 'react';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<string>('all');

    // Get all players from roster (starting + substitutes)
    const allRosterPlayers = Object.values(roster).map(({ player }) => player);

    // Filter players based on search and position
    const filteredPlayers = allRosterPlayers.filter((player) => {
        const matchesSearch = !searchTerm || player.playerName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPosition = selectedPosition === 'all' || player.playerPosition === selectedPosition;

        return matchesSearch && matchesPosition;
    });

    // Get unique positions for filter
    const positions = Array.from(new Set(allRosterPlayers.map((p) => p.playerPosition).filter(Boolean)));

    const handlePlayerClick = (player: RosterPlayer) => {
        if (selectedPlayer?.playerCode === player.playerCode) {
            onPlayerChange(null);
        } else {
            onPlayerChange(player);
        }
    };

    const getPlayerDisplayInfo = (player: RosterPlayer) => {
        // Find which position slot this player is in
        const rosterPlayer = allRosterPlayers.find((rp) => rp.playerCode === player.playerCode);

        return {
            positionSlot: rosterPlayer?.teamPosition,
            isSubstitute: rosterPlayer?.isSub,
            positionType: rosterPlayer?.playerPosition,
        };
    };

    return (
        <div className={styles.playerOutSelector}>
            <div className={styles.selectorHeader}>
                <h3 className={styles.selectorTitle}>Transfer Out</h3>
                <p className={styles.selectorDescription}>Select a player from your current squad</p>
            </div>

            {/* Search and Filter Controls */}
            <div className={styles.filterControls}>
                <div className={styles.searchGroup}>
                    <input
                        type="text"
                        placeholder="Search players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.positionGroup}>
                    <select
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                        className={styles.positionSelect}
                    >
                        <option value="all">All Positions</option>
                        {positions.map((position) => (
                            <option key={position} value={position}>
                                {position}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Player List */}
            <div className={styles.playersList}>
                {filteredPlayers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👤</div>
                        <p className={styles.emptyMessage}>
                            {searchTerm || selectedPosition !== 'all'
                                ? 'No players match your filters'
                                : 'No players in your squad'}
                        </p>
                    </div>
                ) : (
                    filteredPlayers.map((player) => {
                        const displayInfo = getPlayerDisplayInfo(player);
                        const isSelected = selectedPlayer?.playerCode === player.playerCode;
                        const fplPlayer = playersByCode[player.playerCode];
                        const team = teamsByCode[fplPlayer.team_code];

                        return (
                            <div
                                key={player.playerCode}
                                onClick={() => handlePlayerClick(player)}
                                className={`
                                    ${styles.playerItem}
                                    ${isSelected ? styles.selected : ''}
                                `}
                            >
                                <div className={styles.playerContent}>
                                    <div className={styles.playerInfo}>
                                        <div className={styles.playerName}>{player.playerName}</div>
                                        <div className={styles.playerDetails}>
                                            <span className={styles.slotBadge}>
                                                {displayInfo.positionSlot.toUpperCase()}
                                            </span>
                                            {displayInfo.isSubstitute && <span className={styles.subBadge}>SUB</span>}•{' '}
                                            {team.name}
                                        </div>
                                    </div>

                                    <div className={styles.playerStats}>
                                        <div className={styles.statValue}>{fplPlayer.draft.pointsTotal} pts</div>
                                        <div className={styles.statLabel}>Season</div>
                                    </div>
                                </div>

                                {isSelected && <div className={styles.selectedIndicator}>✓</div>}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Selected Player Summary */}
            {selectedPlayer && (
                <div className={styles.selectedSummary}>
                    <div className={styles.summaryHeader}>
                        <span className={styles.summaryLabel}>Selected:</span>
                        <span className={styles.summaryPlayer}>{selectedPlayer.playerName}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
