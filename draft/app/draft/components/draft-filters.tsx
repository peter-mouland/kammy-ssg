import { useMemo } from 'react';
import { MultiSelect, type MultiSelectOption } from '../../_shared/components/multi-select';
import { SearchInput } from '../../_shared/components/search-input';
import { fuzzyStringMatch } from '../../_shared/lib/fuzzy-string-match';
import type { CustomPosition } from '../../_shared/types/league-types';
import { getPositionDisplayName } from '../../scoring/lib';
import { useWishlists } from '../../wishlist/lib/use-wishlists';
import { DRAFT_RULES, getPlayerPosition, validateDraftEligibility } from '../lib/draft-rules';
import type { PositionAvailabilityCounts, SquadComposition, TeamAvailabilityCounts } from '../types/draft-types';
import styles from './draft-filters.module.css';

interface DraftFiltersProps {
    availablePlayers: any[];
    squadComposition: SquadComposition;
    allTeams: any[];
    selectedPositions: string[];
    selectedTeams: string[];
    selectedWishlists: string[];
    searchTerm: string;
    onPositionsChange: (positions: string[]) => void;
    onTeamsChange: (teams: string[]) => void;
    onWishlistsChange: (wishlists: string[]) => void;
    onSearchChange: (search: string) => void;
}

export function DraftFilters({
    availablePlayers,
    squadComposition,
    allTeams,
    selectedPositions,
    selectedTeams,
    selectedWishlists,
    searchTerm,
    onPositionsChange,
    onTeamsChange,
    onWishlistsChange,
    onSearchChange,
}: DraftFiltersProps) {
    const { wishlists } = useWishlists();

    // Create team lookup
    const teamLookup = useMemo(() => {
        return allTeams.reduce(
            (acc, team) => {
                acc[team.code] = team.name || team.short_name;
                return acc;
            },
            {} as Record<number, string>,
        );
    }, [allTeams]);

    // Calculate counts and options
    const { positionOptions, teamOptions, wishlistOptions, eligibleCount, filteredCount } = useMemo(() => {
        // Calculate position and team counts for eligible players
        const positionCounts: PositionAvailabilityCounts = {};
        const teamCounts: TeamAvailabilityCounts = {};

        const draftablePositions = Object.keys(DRAFT_RULES.positions) as CustomPosition[];

        draftablePositions.forEach((position) => {
            positionCounts[position] = { total: 0, eligible: 0 };
        });

        allTeams.forEach((team) => {
            teamCounts[team.code] = { total: 0, eligible: 0 };
        });

        availablePlayers.forEach((player) => {
            const position = getPlayerPosition(player);
            const isEligible = validateDraftEligibility(squadComposition, player).isEligible;

            if (positionCounts[position]) {
                positionCounts[position].total++;
                if (isEligible) positionCounts[position].eligible++;
            }

            if (teamCounts[player.team_code]) {
                teamCounts[player.team_code].total++;
                if (isEligible) teamCounts[player.team_code].eligible++;
            }
        });

        const positionOptions: MultiSelectOption[] = draftablePositions.map((position) => ({
            id: position,
            label: getPositionDisplayName(position),
            count: positionCounts[position]?.eligible || 0,
            disabled: positionCounts[position]?.eligible === 0,
        }));

        const teamOptions: MultiSelectOption[] = allTeams.map((team) => ({
            id: team.code.toString(),
            label: teamLookup[team.code],
            count: teamCounts[team.code]?.eligible || 0,
            disabled: teamCounts[team.code]?.eligible === 0,
        }));

        // Calculate wishlist options with player counts
        const wishlistOptions: MultiSelectOption[] = wishlists.map((wishlist) => {
            const eligiblePlayersInWishlist = availablePlayers.filter((player) => {
                const isEligible = validateDraftEligibility(squadComposition, player).isEligible;
                return isEligible && wishlist.playerCodes.includes(player.code);
            });

            return {
                id: wishlist.id,
                label: wishlist.label,
                count: eligiblePlayersInWishlist.length,
                disabled: eligiblePlayersInWishlist.length === 0,
            };
        });

        // Calculate filtered results
        const eligiblePlayers = availablePlayers.filter(
            (player) => validateDraftEligibility(squadComposition, player).isEligible,
        );

        const filteredPlayers = eligiblePlayers.filter((player) => {
            const position = getPlayerPosition(player);
            if (!selectedPositions.includes(position)) return false;
            if (!selectedTeams.includes(player.team_code.toString())) return false;

            // Wishlist filter
            if (selectedWishlists.length > 0) {
                const playerInSelectedWishlists = selectedWishlists.some((wishlistId) => {
                    const wishlist = wishlists.find((w) => w.id === wishlistId);
                    return wishlist?.playerCodes.includes(player.code);
                });
                if (!playerInSelectedWishlists) return false;
            }

            if (searchTerm) {
                if (
                    !fuzzyStringMatch(player.web_name, searchTerm) &&
                    !fuzzyStringMatch(player.first_name, searchTerm) &&
                    !fuzzyStringMatch(player.second_name, searchTerm)
                ) {
                    return false;
                }
            }

            return true;
        });

        return {
            positionOptions,
            teamOptions,
            wishlistOptions,
            eligibleCount: eligiblePlayers.length,
            filteredCount: filteredPlayers.length,
        };
    }, [
        availablePlayers,
        squadComposition,
        allTeams,
        selectedPositions,
        selectedTeams,
        selectedWishlists,
        searchTerm,
        teamLookup,
        wishlists,
    ]);

    const clearAllFilters = () => {
        onPositionsChange(Object.keys(DRAFT_RULES.positions));
        onTeamsChange(allTeams.map((t) => t.code.toString()));
        onWishlistsChange([]);
        onSearchChange('');
    };

    return (
        <div className={styles.filtersContainer}>
            {/* Search */}
            <SearchInput searchTerm={searchTerm} onSearchChange={onSearchChange} placeholder="Search players..." />

            {/* Positions Filter */}
            <MultiSelect
                options={positionOptions}
                selectedValues={selectedPositions}
                onSelectionChange={onPositionsChange}
                placeholder="Positions"
            />

            {/* Teams Filter */}
            <MultiSelect
                options={teamOptions}
                selectedValues={selectedTeams}
                onSelectionChange={onTeamsChange}
                placeholder="Teams"
                sortOptions={true}
            />

            {/* Wishlists Filter */}
            <MultiSelect
                options={wishlistOptions}
                selectedValues={selectedWishlists}
                onSelectionChange={onWishlistsChange}
                placeholder="Wishlists"
            />

            {/* Clear Button */}
            <button type={'button'} onClick={clearAllFilters} className={styles.clearButton}>
                Reset
            </button>

            {/* Results Summary */}
            <div className={styles.resultsSummary}>
                <span>
                    Showing {filteredCount} of {eligibleCount} eligible players
                </span>
            </div>
        </div>
    );
}
