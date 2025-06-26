/* Location: app/transfers/components/player-in-selector.tsx */

import { useMemo, useState } from 'react';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { RosterPlayer } from '../../teams/types/team-types';
import type { PlayerEligibility } from '../types/transfer-form-types';
import type { TransferType } from '../types/transfer-types';
import styles from './player-in-selector.module.css';

interface PlayerInSelectorProps {
    availablePlayers: EnhancedPlayerData[];
    selectedPlayer: EnhancedPlayerData | null;
    onPlayerChange: (player: EnhancedPlayerData | null) => void;
    transferType: TransferType;
    playerOut: RosterPlayer | null;
}

export function PlayerInSelector({
    availablePlayers,
    selectedPlayer,
    onPlayerChange,
    transferType,
    playerOut,
}: PlayerInSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<string>('all');
    const [selectedTeam, setSelectedTeam] = useState<string>('all');
    const [showOnlyEligible, setShowOnlyEligible] = useState(false);

    // Calculate player eligibility
    const getPlayerEligibility = (player: EnhancedPlayerData): PlayerEligibility => {
        // Position compatibility check
        if (playerOut && transferType === 'TRANSFER') {
            const playerOutPosition = playerOut.playerPosition.toLowerCase();
            const playerInPosition = player.draft?.position.toLowerCase();

            if (playerOutPosition !== playerInPosition) {
                return {
                    isEligible: false,
                    reason: `Position mismatch: need ${playerOutPosition}, this is ${playerInPosition}`,
                    icon: '⚠️',
                };
            }
        }

        // TODO: Add more validation rules from existing transfer validation system
        // - Team player limits
        // - Transfer windows
        // - Loan restrictions
        // - etc.

        return {
            isEligible: true,
        };
    };

    // Filter and sort players
    const filteredPlayers = useMemo(() => {
        const filtered = availablePlayers.filter((player) => {
            const eligibility = getPlayerEligibility(player);

            // Search filter
            const matchesSearch =
                !searchTerm ||
                player.web_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                player.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                player.second_name.toLowerCase().includes(searchTerm.toLowerCase());

            // Position filter
            const matchesPosition = selectedPosition === 'all' || player.draft?.position === selectedPosition;

            // Team filter
            const matchesTeam = selectedTeam === 'all' || player.team_code.toString() === selectedTeam;

            // Eligibility filter
            const matchesEligibility = !showOnlyEligible || eligibility.isEligible;

            return matchesSearch && matchesPosition && matchesTeam && matchesEligibility;
        });

        // Sort by eligibility first, then by points
        return filtered.sort((a, b) => {
            const aEligible = getPlayerEligibility(a).isEligible;
            const bEligible = getPlayerEligibility(b).isEligible;

            if (aEligible !== bEligible) {
                return bEligible ? 1 : -1; // Eligible players first
            }

            // Then sort by total points (descending)
            return (b.draft?.pointsTotal || 0) - (a.draft?.pointsTotal || 0);
        });
    }, [availablePlayers, searchTerm, selectedPosition, selectedTeam, showOnlyEligible, playerOut, transferType]);

    // Get unique positions and teams for filters
    const positions = Array.from(new Set(availablePlayers.map((p) => p.draft?.position).filter(Boolean))).sort();
    const teamCodes = Array.from(new Set(availablePlayers.map((p) => p.team_code)));

    const handlePlayerClick = (player: EnhancedPlayerData) => {
        const eligibility = getPlayerEligibility(player);

        if (!eligibility.isEligible) {
            return; // Don't allow selection of ineligible players
        }

        if (selectedPlayer?.code === player.code) {
            onPlayerChange(null);
        } else {
            onPlayerChange(player);
        }
    };

    const eligibleCount = filteredPlayers.filter((p) => getPlayerEligibility(p).isEligible).length;
    const totalCount = filteredPlayers.length;

    // Get team name helper
    const getTeamName = (teamCode: number) => {
        const team = teamCodes.find((code) => code === teamCode);
        return team?.name || `Team ${teamCode}`;
    };

    return (
        <div className={styles.playerInSelector}>
            <div className={styles.selectorHeader}>
                <h3 className={styles.selectorTitle}>Transfer In</h3>
                <p className={styles.selectorDescription}>Select an available player to bring into your squad</p>
                <div className={styles.statsInfo}>
                    <span className={styles.eligibleCount}>{eligibleCount} eligible</span>
                    <span className={styles.totalCount}>of {totalCount} players</span>
                </div>
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

                <div className={styles.filterRow}>
                    <select
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Positions</option>
                        {positions.map((position) => (
                            <option key={position} value={position}>
                                {position}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Teams</option>
                        {teamCodes.sort().map((code) => (
                            <option key={code} value={code.toString()}>
                                {code}
                            </option>
                        ))}
                    </select>

                    <label className={styles.eligibilityToggle}>
                        <input
                            type="checkbox"
                            checked={showOnlyEligible}
                            onChange={(e) => setShowOnlyEligible(e.target.checked)}
                            className={styles.eligibilityCheckbox}
                        />
                        <span className={styles.eligibilityLabel}>Eligible only</span>
                    </label>
                </div>
            </div>

            {/* Player List */}
            <div className={styles.playersList}>
                {filteredPlayers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🔍</div>
                        <p className={styles.emptyMessage}>No players match your current filters</p>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedPosition('all');
                                setSelectedTeam('all');
                                setShowOnlyEligible(false);
                            }}
                            className={styles.clearFiltersButton}
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    filteredPlayers.map((player) => {
                        const eligibility = getPlayerEligibility(player);
                        const isSelected = selectedPlayer?.code === player.code;
                        const isEligible = eligibility.isEligible;

                        return (
                            <div
                                key={player.code}
                                onClick={() => handlePlayerClick(player)}
                                className={`
                                    ${styles.playerItem}
                                    ${isSelected ? styles.selected : ''}
                                    ${isEligible ? '' : styles.ineligible}
                                `}
                                title={eligibility.reason}
                            >
                                <div className={styles.playerContent}>
                                    <div className={styles.playerInfo}>
                                        <div className={styles.playerName}>
                                            {player.first_name} {player.second_name}
                                            {!isEligible && (
                                                <span className={styles.ineligibleIcon}>{eligibility.icon}</span>
                                            )}
                                        </div>
                                        <div className={styles.playerDetails}>
                                            <span className={styles.positionBadge}>
                                                {player.draft?.position || 'Unknown'}
                                            </span>
                                            <span className={styles.teamBadge}>{getTeamName(player.team_code)}</span>
                                        </div>
                                        {!isEligible && (
                                            <div className={styles.ineligibleReason}>{eligibility.reason}</div>
                                        )}
                                    </div>

                                    <div className={styles.playerStats}>
                                        <div className={styles.statValue}>{player.draft?.pointsTotal || 0} pts</div>
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
                        <span className={styles.summaryPlayer}>
                            {selectedPlayer.first_name} {selectedPlayer.second_name}
                        </span>
                    </div>
                    <div className={styles.summaryDetails}>
                        <span className={styles.summaryDetail}>
                            {selectedPlayer.draft?.position} • {getTeamName(selectedPlayer.team_code)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
