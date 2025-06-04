// components/compact-multi-select.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { validateDraftEligibility, getPlayerPosition, DRAFT_RULES } from '../lib/draft/draft-rules';
import { getPositionDisplayName } from '../lib/points';
import styles from './multi-select-filters.module.css';

interface CompactMultiSelectProps {
    availablePlayers: any[];
    currentUserPicks: any[];
    allTeams: any[];
    selectedPositions: string[];
    selectedTeams: string[];
    searchTerm: string;
    onPositionsChange: (positions: string[]) => void;
    onTeamsChange: (teams: string[]) => void;
    onSearchChange: (search: string) => void;
}

export function MultiSelectFilters({
                                       availablePlayers,
                                       currentUserPicks,
                                       allTeams,
                                       selectedPositions,
                                       selectedTeams,
                                       searchTerm,
                                       onPositionsChange,
                                       onTeamsChange,
                                       onSearchChange
                                   }: CompactMultiSelectProps) {
    const [openDropdown, setOpenDropdown] = useState<'positions' | 'teams' | null>(null);
    const positionsRef = useRef<HTMLDivElement>(null);
    const teamsRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                positionsRef.current && !positionsRef.current.contains(event.target as Node) &&
                teamsRef.current && !teamsRef.current.contains(event.target as Node)
            ) {
                setOpenDropdown(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Create team lookup
    const teamLookup = useMemo(() => {
        return allTeams.reduce((acc, team) => {
            acc[team.id] = team.name || team.short_name || `Team ${team.id}`;
            return acc;
        }, {} as Record<number, string>);
    }, [allTeams]);

    // Calculate availability
    const availability = useMemo(() => {
        const positionCounts: Record<string, { total: number; eligible: number }> = {};
        const teamCounts: Record<string, { total: number; eligible: number }> = {};

        // Initialize counts
        Object.keys(DRAFT_RULES.positions).forEach(pos => {
            positionCounts[pos] = { total: 0, eligible: 0 };
        });

        allTeams.forEach(team => {
            teamCounts[team.id] = { total: 0, eligible: 0 };
        });

        // Count players
        availablePlayers.forEach(player => {
            const position = getPlayerPosition(player);
            const teamId = player.team;

            if (positionCounts[position]) {
                positionCounts[position].total++;
                const validation = validateDraftEligibility(currentUserPicks, player);
                if (validation.isEligible) {
                    positionCounts[position].eligible++;
                }
            }

            if (teamCounts[teamId]) {
                teamCounts[teamId].total++;
                const validation = validateDraftEligibility(currentUserPicks, player);
                if (validation.isEligible) {
                    teamCounts[teamId].eligible++;
                }
            }
        });

        return { positionCounts, teamCounts };
    }, [availablePlayers, currentUserPicks, allTeams]);

    const handlePositionToggle = (position: string) => {
        if (selectedPositions.includes(position)) {
            onPositionsChange(selectedPositions.filter(p => p !== position));
        } else {
            onPositionsChange([...selectedPositions, position]);
        }
    };

    const handleTeamToggle = (teamId: string) => {
        if (selectedTeams.includes(teamId)) {
            onTeamsChange(selectedTeams.filter(t => t !== teamId));
        } else {
            onTeamsChange([...selectedTeams, teamId]);
        }
    };

    const clearAllFilters = () => {
        onPositionsChange(Object.keys(DRAFT_RULES.positions));
        onTeamsChange(allTeams.map(t => t.id.toString()));
        onSearchChange('');
    };

    // Generate dropdown text
    const getPositionsText = () => {
        const total = Object.keys(DRAFT_RULES.positions).length;
        if (selectedPositions.length === total) return 'All Positions';
        if (selectedPositions.length === 0) return 'No Positions';
        if (selectedPositions.length === 1) return getPositionDisplayName(selectedPositions[0]);
        return `${selectedPositions.length} Positions`;
    };

    const getTeamsText = () => {
        if (selectedTeams.length === allTeams.length) return 'All Teams';
        if (selectedTeams.length === 0) return 'No Teams';
        if (selectedTeams.length === 1) {
            const teamId = parseInt(selectedTeams[0]);
            return teamLookup[teamId] || `Team ${teamId}`;
        }
        return `${selectedTeams.length} Teams`;
    };

    // Calculate filtered results
    const eligibleCount = availablePlayers.filter(player =>
        validateDraftEligibility(currentUserPicks, player).isEligible
    ).length;

    const filteredCount = availablePlayers.filter(player => {
        // Check eligibility
        if (!validateDraftEligibility(currentUserPicks, player).isEligible) return false;

        // Check filters
        const position = getPlayerPosition(player);
        if (!selectedPositions.includes(position)) return false;
        if (!selectedTeams.includes(player.team.toString())) return false;

        // Check search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const fullName = `${player.first_name} ${player.second_name}`.toLowerCase();
            const webName = player.web_name?.toLowerCase() || '';
            if (!fullName.includes(searchLower) && !webName.includes(searchLower)) return false;
        }

        return true;
    }).length;

    return (
        <div className={styles.filtersContainer}>
            {/* Search */}
            <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className={styles.searchInput}
            />

            {/* Positions Dropdown */}
            <div className={styles.dropdown} ref={positionsRef}>
                <button
                    className={`${styles.dropdownButton} ${openDropdown === 'positions' ? styles.open : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'positions' ? null : 'positions')}
                >
                    <span className={styles.dropdownText}>{getPositionsText()}</span>
                    <span className={styles.dropdownArrow}>▼</span>
                </button>

                {openDropdown === 'positions' && (
                    <div className={styles.dropdownMenu}>
                        {Object.entries(DRAFT_RULES.positions).map(([position, rule]) => {
                            const counts = availability.positionCounts[position];
                            const isSelected = selectedPositions.includes(position);
                            const isDisabled = counts.eligible === 0;

                            const itemClass = `${styles.dropdownItem} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`;

                            return (
                                <div
                                    key={position}
                                    className={itemClass}
                                    onClick={() => !isDisabled && handlePositionToggle(position)}
                                >
                                    <div className={styles.checkbox}>
                                        {isSelected && <span className={styles.checkmark}>✓</span>}
                                    </div>
                                    <span className={styles.itemLabel}>
                    {getPositionDisplayName(position)}
                  </span>
                                    <span className={styles.itemCount}>
                    {counts.eligible}
                  </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Teams Dropdown */}
            <div className={styles.dropdown} ref={teamsRef}>
                <button
                    className={`${styles.dropdownButton} ${openDropdown === 'teams' ? styles.open : ''}`}
                    onClick={() => setOpenDropdown(openDropdown === 'teams' ? null : 'teams')}
                >
                    <span className={styles.dropdownText}>{getTeamsText()}</span>
                    <span className={styles.dropdownArrow}>▼</span>
                </button>

                {openDropdown === 'teams' && (
                    <div className={styles.dropdownMenu}>
                        {allTeams
                            .sort((a, b) => (teamLookup[a.id] || '').localeCompare(teamLookup[b.id] || ''))
                            .map(team => {
                                const counts = availability.teamCounts[team.id];
                                const isSelected = selectedTeams.includes(team.id.toString());
                                const isDisabled = counts.eligible === 0;

                                const itemClass = `${styles.dropdownItem} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`;

                                return (
                                    <div
                                        key={team.id}
                                        className={itemClass}
                                        onClick={() => !isDisabled && handleTeamToggle(team.id.toString())}
                                    >
                                        <div className={styles.checkbox}>
                                            {isSelected && <span className={styles.checkmark}>✓</span>}
                                        </div>
                                        <span className={styles.itemLabel}>
                      {teamLookup[team.id]}
                    </span>
                                        <span className={styles.itemCount}>
                      {counts.eligible}
                    </span>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Clear Button */}
            <button onClick={clearAllFilters} className={styles.clearButton}>
                Reset
            </button>

            {/* Results Summary */}
            <div className={styles.resultsSummary}>
                <span>Showing {filteredCount} of {eligibleCount} eligible players</span>
            </div>
        </div>
    );
}
