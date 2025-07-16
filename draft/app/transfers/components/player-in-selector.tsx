// app/transfers/components/player-in-selector.tsx

import { useMemo, useState } from 'react';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { fuzzyStringMatch } from '../../_shared/lib/fuzzy-string-match';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
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
        if (searchTerm) {
            filtered = filtered.filter(
                (player) =>
                    fuzzyStringMatch(player.web_name, searchTerm) ||
                    fuzzyStringMatch(player.first_name, searchTerm) ||
                    fuzzyStringMatch(player.second_name, searchTerm),
            );
        }

        // Position filter
        if (selectedPosition !== 'all') {
            filtered = filtered.filter(
                (player) => player.draft?.position.toLowerCase() === selectedPosition.toLowerCase(),
            );
        }

        // Team filter
        if (selectedTeam !== 'all') {
            filtered = filtered.filter((player) => player.team_code === Number.parseInt(selectedTeam));
        }

        // Eligibility filter
        if (showOnlyEligible) {
            filtered = filtered.filter((player) => getPlayerEligibility(player).isEligible);
        }

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
        .map((code: number) => teamsByCode[code])
        .sort((a, b) => (a.name < b.name ? -1 : 1));

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
                    {teams.map((team) => (
                        <option key={team.code} value={team.code}>
                            {team.name}
                        </option>
                    ))}
                </select>

                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={showOnlyEligible}
                        onChange={(e) => setShowOnlyEligible(e.target.checked)}
                        className={styles.checkbox}
                    />
                    Show only eligible
                </label>
            </div>

            {/* Player List */}
            <div className={styles.playerList}>
                {filteredPlayers.map((player) => (
                    <div
                        key={player.id}
                        className={`${styles.playerCard} ${selectedPlayer?.id === player.id ? styles.selected : ''} ${
                            player.eligibility.isEligible ? '' : styles.ineligible
                        }`}
                        onClick={() => onPlayerChange(player)}
                    >
                        <div className={styles.playerInfo}>
                            <div className={styles.playerName}>{player.web_name}</div>
                            <div className={styles.playerDetails}>
                                <span className={styles.slotBadge}>{player.draft?.position.toUpperCase()}</span> •{' '}
                                {teamsByCode[player.team_code].name}
                            </div>
                        </div>

                        <div className={styles.playerStatus}>
                            <span className={styles.eligibilityIcon}>{player.eligibility.icon}</span>
                            <div className={styles.statusText}>
                                <div className={styles.eligibilityReason}>{player.eligibility.reason}</div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredPlayers.length === 0 && <div className={styles.noPlayers}>No players match your criteria</div>}
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
