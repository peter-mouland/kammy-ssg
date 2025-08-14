/* Location: app/players/components/players-filters.tsx */

import { MultiSelect, type MultiSelectOption } from '../../_shared/components/multi-select';
import { SearchInput } from '../../_shared/components/search-input';
import styles from './players-filters.module.css';

interface PlayersFiltersProps {
    searchTerm: string;
    onSearchChange: (search: string) => void;
    positionOptions: MultiSelectOption[];
    selectedPositions: string[];
    onPositionsChange: (positions: string[]) => void;
    teamOptions: MultiSelectOption[];
    selectedTeams: string[];
    onTeamsChange: (teams: string[]) => void;
    onReset: () => void;
    isUpdating?: boolean;
}

export function PlayersFilters({
    searchTerm,
    onSearchChange,
    positionOptions,
    selectedPositions,
    onPositionsChange,
    teamOptions,
    selectedTeams,
    onTeamsChange,
    onReset,
    isUpdating = false,
}: PlayersFiltersProps) {
    const hasActiveFilters = searchTerm || selectedPositions.length > 0 || selectedTeams.length > 0;

    return (
        <div className={styles.filtersContainer}>
            <div className={styles.filtersRow}>
                {/* Search */}
                <div className={styles.searchGroup}>
                    <SearchInput value={searchTerm} onChange={onSearchChange} placeholder="Search players..." />
                </div>

                {/* Positions Filter */}
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Positions</label>
                    <MultiSelect
                        options={positionOptions}
                        selectedValues={selectedPositions}
                        onSelectionChange={onPositionsChange}
                        placeholder="positions"
                        className={styles.multiSelect}
                    />
                </div>

                {/* Teams Filter */}
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Teams</label>
                    <MultiSelect
                        options={teamOptions}
                        selectedValues={selectedTeams}
                        onSelectionChange={onTeamsChange}
                        placeholder="teams"
                        className={styles.multiSelect}
                        sortOptions={true}
                    />
                </div>

                {/* Clear Button */}
                <div className={styles.actionsGroup}>
                    <button onClick={onReset} className={styles.resetButton} disabled={!hasActiveFilters || isUpdating}>
                        {isUpdating ? 'Updating...' : 'Reset'}
                    </button>
                </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className={styles.activeFilters}>
                    <span className={styles.activeFiltersLabel}>Active filters:</span>
                    <div className={styles.activeFiltersList}>
                        {searchTerm && <span className={styles.activeFilter}>Search: "{searchTerm}"</span>}
                        {selectedPositions.length > 0 && (
                            <span className={styles.activeFilter}>
                                {selectedPositions.length} position{selectedPositions.length > 1 ? 's' : ''}
                            </span>
                        )}
                        {selectedTeams.length > 0 && (
                            <span className={styles.activeFilter}>
                                {selectedTeams.length} team{selectedTeams.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
