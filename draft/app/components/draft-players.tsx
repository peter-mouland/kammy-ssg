// components/draft-players.tsx - Optimized version
import React, { useState, useMemo, useEffect } from 'react';
import {
    validateDraftEligibility,
    getPlayerPosition,
    DRAFT_RULES,
    getSquadComposition,
} from '../lib/draft/draft-rules';
import { DraftFilters } from './draft-filters';
import { getPositionDisplayName } from '../lib/points';
import styles from './draft-players.module.css';

interface DraftPlayersProps {
    onSelectPlayer: (playerId: string) => void;
    availablePlayers: any[];
    isUserTurn: boolean;
    currentUserPicks: any[];
    allTeams?: any[];
}

interface PlayerWithValidation {
    player: any;
    validation: ReturnType<typeof validateDraftEligibility>;
    position: string;
}

export function DraftPlayers({
                                 onSelectPlayer,
                                 availablePlayers,
                                 isUserTurn,
                                 currentUserPicks,
                                 allTeams = []
                             }: DraftPlayersProps) {
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filtersInitialized, setFiltersInitialized] = useState(false);
    const squadComposition = getSquadComposition(currentUserPicks);



    // Pre-compute validations for all players - this avoids duplicate calculations
    const playersWithValidation = useMemo((): PlayerWithValidation[] => {
        return availablePlayers.map(player => ({
            player,
            validation: validateDraftEligibility(squadComposition, player),
            position: getPlayerPosition(player)
        }));
    }, [availablePlayers, squadComposition]);


    // Get only eligible players (those that can be drafted)
    const eligiblePlayersWithValidation = useMemo(() => {
        return playersWithValidation.filter(item => item.validation.isEligible);
    }, [playersWithValidation]);

    // Initialize filters based on eligible players
    useEffect(() => {
        if (eligiblePlayersWithValidation.length > 0 && allTeams.length > 0 && !filtersInitialized) {

            // Get positions that have eligible players
            const availablePositions = Object.keys(DRAFT_RULES.positions).filter(position =>
                eligiblePlayersWithValidation.some(item => item.position === position)
            );

            // Get teams that have eligible players
            const availableTeamCodes = allTeams
                .filter(team =>
                    eligiblePlayersWithValidation.some(item => item.player.team_code === team.code)
                )
                .map(team => team.code.toString());

            setSelectedPositions(availablePositions);
            setSelectedTeams(availableTeamCodes);
            setFiltersInitialized(true);
        }
    }, [eligiblePlayersWithValidation, allTeams, currentUserPicks.length, filtersInitialized]);

    // Reset filters when currentUserPicks changes
    useEffect(() => {
        if (filtersInitialized) {
            setFiltersInitialized(false);
        }
    }, [currentUserPicks.length]);

    // Team lookup for display names
    const teamLookup = useMemo(() => {
        return allTeams.reduce((acc, team) => {
            acc[team.code] = team.name || team.short_name;
            return acc;
        }, {} as Record<number, string>);
    }, [allTeams]);

    // Apply user filters to eligible players
    const filteredPlayersWithValidation = useMemo(() => {
        return eligiblePlayersWithValidation.filter(({ player, position }) => {
            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const fullName = `${player.first_name} ${player.second_name}`.toLowerCase();
                const webName = player.web_name?.toLowerCase() || '';
                if (!fullName.includes(searchLower) && !webName.includes(searchLower)) {
                    return false;
                }
            }

            // Position filter
            if (!selectedPositions.includes(position)) {
                return false;
            }

            // Team filter
            if (!selectedTeams.includes(player.team_code.toString())) {
                return false;
            }

            return true;
        });
    }, [eligiblePlayersWithValidation, searchTerm, selectedPositions, selectedTeams]);

    // Calculate stats for display
    const stats = useMemo(() => {
        const totalAvailable = availablePlayers.length;
        const totalEligible = eligiblePlayersWithValidation.length;
        const totalFiltered = filteredPlayersWithValidation.length;
        const hiddenByRules = totalAvailable - totalEligible;
        const hiddenByFilters = totalEligible - totalFiltered;

        return {
            totalAvailable,
            totalEligible,
            totalFiltered,
            hiddenByRules,
            hiddenByFilters
        };
    }, [availablePlayers.length, eligiblePlayersWithValidation.length, filteredPlayersWithValidation.length]);

    // Don't render until filters are initialized
    if (!filtersInitialized && availablePlayers.length > 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Available Players</h2>
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        Loading filters...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Available Players</h2>

                {/* Pass pre-computed data to avoid recalculation */}
                <DraftFilters
                    availablePlayers={availablePlayers}
                    squadComposition={squadComposition}
                    allTeams={allTeams}
                    selectedPositions={selectedPositions}
                    selectedTeams={selectedTeams}
                    searchTerm={searchTerm}
                    onPositionsChange={setSelectedPositions}
                    onTeamsChange={setSelectedTeams}
                    onSearchChange={setSearchTerm}
                />
            </div>

            <div className={styles.playersList}>
                {filteredPlayersWithValidation.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            {stats.totalEligible === 0 ? '🚫' : '🔍'}
                        </div>
                        <p>
                            {stats.totalEligible === 0
                                ? 'No players available due to draft rules.'
                                : 'No players match your current filters.'
                            }
                        </p>
                        {stats.hiddenByFilters > 0 && (
                            <p className={styles.filterHint}>
                                Try adjusting your position or team filters to see {stats.hiddenByFilters} more eligible players.
                            </p>
                        )}
                        {stats.hiddenByRules > 0 && (
                            <p className={styles.rulesHint}>
                                {stats.hiddenByRules} players are hidden due to draft rules.
                            </p>
                        )}
                    </div>
                ) : (
                    <div>
                        {filteredPlayersWithValidation.map(({ player, validation, position }) => {
                            const teamName = teamLookup[player.team_code];
                            const itemClass = `${styles.playerItem} ${!isUserTurn ? styles.disabled : ''}`;

                            return (
                                <div
                                    key={player.id}
                                    className={itemClass}
                                    onClick={() => isUserTurn && onSelectPlayer(player.id.toString())}
                                >
                                    <div className={styles.playerContent}>
                                        <div className={styles.playerInfo}>
                                            <div className={styles.playerName}>
                                                <span>{player.first_name} {player.second_name}</span>
                                                {validation.canAddToSub && (
                                                    <span className={styles.subOnlyBadge}>
                                                        SUB ONLY
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.playerDetails}>
                                                <span className={styles.positionBadge}>
                                                    {getPositionDisplayName(position)}
                                                </span>
                                                <span>•</span>
                                                <span>{teamName}</span>
                                                <span>•</span>
                                                <span>£{(player.now_cost / 10).toFixed(1)}m</span>
                                            </div>
                                        </div>

                                        <div className={styles.playerPrice}>
                                            <div className={styles.priceValue}>
                                                {player.draft.pointsTotal} pts
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
