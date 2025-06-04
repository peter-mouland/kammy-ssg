// components/draft-players.tsx - Updated with multi-select filters
import React, { useState, useMemo, useEffect } from 'react';
import { useEligiblePlayers, validateDraftEligibility, getPlayerPosition, DRAFT_RULES } from '../lib/draft/draft-rules';
import { MultiSelectFilters } from './multi-select-filters';
import { getPositionDisplayName } from '../lib/points';
import styles from './draft-players.module.css';

interface DraftPlayersProps {
    onSelectPlayer: (playerId: string) => void;
    availablePlayers: any[];
    isUserTurn: boolean;
    currentUserPicks: any[];
    allTeams?: any[];
}

export function DraftPlayers({
                                 onSelectPlayer,
                                 availablePlayers,
                                 isUserTurn,
                                 currentUserPicks,
                                 allTeams = []
                             }: DraftPlayersProps) {
    // Initialize with all positions and teams selected
    const [selectedPositions, setSelectedPositions] = useState<string[]>(() =>
        Object.keys(DRAFT_RULES.positions)
    );
    const [selectedTeams, setSelectedTeams] = useState<string[]>(() =>
        allTeams.map(team => team.id.toString())
    );
    const [searchTerm, setSearchTerm] = useState("");

    // Update teams when allTeams changes (on initial load)
    useEffect(() => {
        if (allTeams.length > 0 && selectedTeams.length === 0) {
            setSelectedTeams(allTeams.map(team => team.id.toString()));
        }
    }, [allTeams, selectedTeams.length]);

    // Get team lookup for better names
    const teamLookup = useMemo(() => {
        return allTeams.reduce((acc, team) => {
            acc[team.id] = team.name || team.short_name || `Team ${team.id}`;
            return acc;
        }, {} as Record<number, string>);
    }, [allTeams]);

    // Filter players based on draft rules (eligible players only)
    const { eligiblePlayers, hiddenCount, violations } = useEligiblePlayers(availablePlayers, currentUserPicks);

    // Apply user filters on top of eligible players
    const filteredPlayers = useMemo(() => {
        return eligiblePlayers.filter(player => {
            // Search term filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const fullName = `${player.first_name} ${player.second_name}`.toLowerCase();
                const webName = player.web_name?.toLowerCase() || '';
                if (!fullName.includes(searchLower) && !webName.includes(searchLower)) {
                    return false;
                }
            }

            // Position filter
            const playerPosition = getPlayerPosition(player);
            if (!selectedPositions.includes(playerPosition)) {
                return false;
            }

            // Team filter
            if (!selectedTeams.includes(player.team.toString())) {
                return false;
            }

            return true;
        });
    }, [eligiblePlayers, searchTerm, selectedPositions, selectedTeams]);

    // Count filtered out eligible players (for display)
    const filteredOutCount = eligiblePlayers.length - filteredPlayers.length;

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Available Players</h2>

                {/* Multi-select Filters */}
                <MultiSelectFilters
                    availablePlayers={availablePlayers}
                    currentUserPicks={currentUserPicks}
                    allTeams={allTeams}
                    selectedPositions={selectedPositions}
                    selectedTeams={selectedTeams}
                    searchTerm={searchTerm}
                    onPositionsChange={setSelectedPositions}
                    onTeamsChange={setSelectedTeams}
                    onSearchChange={setSearchTerm}
                />

                {/* Results summary */}
                <div className={styles.resultsSummary}>
                    <span>Showing {filteredPlayers.length} players</span>
                    {filteredOutCount > 0 && (
                        <span>({filteredOutCount} eligible but filtered out)</span>
                    )}
                    {hiddenCount > 0 && (
                        <span>({hiddenCount} blocked by draft rules)</span>
                    )}
                </div>
            </div>

            <div className={styles.playersList}>
                {filteredPlayers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            {eligiblePlayers.length === 0 ? '🚫' : '🔍'}
                        </div>
                        <p>
                            {eligiblePlayers.length === 0
                                ? 'No players available due to draft rules.'
                                : 'No players match your current filters.'
                            }
                        </p>
                        {filteredOutCount > 0 && (
                            <p className={styles.filterHint}>
                                Try adjusting your position or team filters to see more players.
                            </p>
                        )}
                    </div>
                ) : (
                    <div>
                        {filteredPlayers.map((player) => {
                            const playerPosition = getPlayerPosition(player);
                            const teamName = teamLookup[player.team] || `Team ${player.team}`;
                            const validation = validateDraftEligibility(currentUserPicks, player);

                            const itemClass = `${styles.playerItem} ${!isUserTurn ? styles.disabled : ''}`;

                            return (
                                <div
                                    key={player.id}
                                    className={itemClass}
                                    onClick={() => isUserTurn && onSelectPlayer(player.id.toString())}
                                >
                                    <div className={styles.playerContent}>
                                        {/* Player Info */}
                                        <div className={styles.playerInfo}>
                                            <div className={styles.playerName}>
                                                <span>{player.first_name} {player.second_name}</span>
                                                {validation.canAddToSub && !validation.isEligible && (
                                                    <span className={styles.subOnlyBadge}>
                                                        SUB ONLY
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.playerDetails}>
                                                <span className={styles.positionBadge}>
                                                    {getPositionDisplayName(playerPosition)}
                                                </span>
                                                <span>•</span>
                                                <span>{teamName}</span>
                                                <span>•</span>
                                                <span>{player.total_points} pts</span>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className={styles.playerPrice}>
                                            <div className={styles.priceValue}>
                                                £{(player.now_cost / 10).toFixed(1)}m
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
