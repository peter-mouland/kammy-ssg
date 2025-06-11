import React, { useMemo } from 'react';
import { DraftFiltersSearch } from './draft-filters-search';
import { DraftFiltersMultiSelect, type MultiSelectOption } from './draft-filters-multi-select';
import { validateDraftEligibility, getPlayerPosition, DRAFT_RULES } from '../lib/draft-rules';
import { getPositionDisplayName } from '../../scoring/lib';
import styles from './draft-filters.module.css';

interface DraftFiltersProps {
    availablePlayers: any[];
    squadComposition: any[];
    allTeams: any[];
    selectedPositions: string[];
    selectedTeams: string[];
    searchTerm: string;
    onPositionsChange: (positions: string[]) => void;
    onTeamsChange: (teams: string[]) => void;
    onSearchChange: (search: string) => void;
}

export function DraftFilters({
                                 availablePlayers,
                                 squadComposition,
                                 allTeams,
                                 selectedPositions,
                                 selectedTeams,
                                 searchTerm,
                                 onPositionsChange,
                                 onTeamsChange,
                                 onSearchChange
                             }: DraftFiltersProps) {

    // Create team lookup
    const teamLookup = useMemo(() => {
        return allTeams.reduce((acc, team) => {
            acc[team.code] = team.name || team.short_name;
            return acc;
        }, {} as Record<number, string>);
    }, [allTeams]);

    // Calculate availability for positions and teams
    const { positionOptions, teamOptions, eligibleCount, filteredCount } = useMemo(() => {
        const positionCounts: Record<string, { total: number; eligible: number }> = {};
        const teamCounts: Record<string, { total: number; eligible: number }> = {};

        // Initialize counts
        Object.keys(DRAFT_RULES.positions).forEach(pos => {
            positionCounts[pos] = { total: 0, eligible: 0 };
        });

        allTeams.forEach(team => {
            teamCounts[team.code] = { total: 0, eligible: 0 };
        });

        // Count all available players
        availablePlayers.forEach(player => {
            const position = getPlayerPosition(player);
            const teamCode = player.team_code;
            const validation = validateDraftEligibility(squadComposition, player);

            if (positionCounts[position]) {
                positionCounts[position].total++;
                if (validation.isEligible) {
                    positionCounts[position].eligible++;
                }
            }

            if (teamCounts[teamCode]) {
                teamCounts[teamCode].total++;
                if (validation.isEligible) {
                    teamCounts[teamCode].eligible++;
                }
            }
        });

        // Convert to MultiSelectOption format
        const positionOptions: MultiSelectOption[] = Object.entries(DRAFT_RULES.positions).map(([position]) => ({
            id: position,
            label: getPositionDisplayName(position),
            count: positionCounts[position]?.eligible || 0,
            disabled: positionCounts[position]?.eligible === 0
        }));

        const teamOptions: MultiSelectOption[] = allTeams.map(team => ({
            id: team.code.toString(),
            label: teamLookup[team.code],
            count: teamCounts[team.code]?.eligible || 0,
            disabled: teamCounts[team.code]?.eligible === 0
        }));

        // Calculate filtered results
        const eligiblePlayers = availablePlayers.filter(player =>
          validateDraftEligibility(squadComposition, player).isEligible
        );

        const filteredPlayers = eligiblePlayers.filter(player => {
            const position = getPlayerPosition(player);
            if (!selectedPositions.includes(position)) return false;
            if (!selectedTeams.includes(player.team_code.toString())) return false;

            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const fullName = `${player.first_name} ${player.second_name}`.toLowerCase();
                const webName = player.web_name?.toLowerCase() || '';
                if (!fullName.includes(searchLower) && !webName.includes(searchLower)) return false;
            }

            return true;
        });

        return {
            positionOptions,
            teamOptions,
            eligibleCount: eligiblePlayers.length,
            filteredCount: filteredPlayers.length
        };
    }, [availablePlayers, squadComposition, allTeams, selectedPositions, selectedTeams, searchTerm, teamLookup]);

    const clearAllFilters = () => {
        onPositionsChange(Object.keys(DRAFT_RULES.positions));
        onTeamsChange(allTeams.map(t => t.id.toString()));
        onSearchChange('');
    };

    return (
      <div className={styles.filtersContainer}>
          {/* Search */}
          <DraftFiltersSearch
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            placeholder="Search players..."
          />

          {/* Positions Filter */}
          <DraftFiltersMultiSelect
            options={positionOptions}
            selectedValues={selectedPositions}
            onSelectionChange={onPositionsChange}
            placeholder="Positions"
          />

          {/* Teams Filter */}
          <DraftFiltersMultiSelect
            options={teamOptions}
            selectedValues={selectedTeams}
            onSelectionChange={onTeamsChange}
            placeholder="Teams"
            sortOptions={true}
          />

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
