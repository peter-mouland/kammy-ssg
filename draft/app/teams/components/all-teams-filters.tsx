/* Location: app/teams/components/all-teams-filters.tsx */

import { MultiSelect, type MultiSelectOption } from '../../_shared/components/multi-select';
import { SearchInput } from '../../_shared/components/search-input';
import styles from './all-teams-filters.module.css';

interface AllTeamsFiltersProps {
    searchTerm: string;
    onSearchChange: (search: string) => void;
    managerOptions: MultiSelectOption[];
    selectedManagers: string[];
    onManagersChange: (managers: string[]) => void;
    positionOptions: MultiSelectOption[];
    selectedPositions: string[];
    onPositionsChange: (positions: string[]) => void;
    loanStatusOptions: MultiSelectOption[];
    selectedLoanStatuses: string[];
    onLoanStatusesChange: (statuses: string[]) => void;
    onReset: () => void;
    isUpdating?: boolean;
}

export function AllTeamsFilters({
    searchTerm,
    onSearchChange,
    managerOptions,
    selectedManagers,
    onManagersChange,
    positionOptions,
    selectedPositions,
    onPositionsChange,
    loanStatusOptions,
    selectedLoanStatuses,
    onLoanStatusesChange,
    onReset,
    isUpdating = false,
}: AllTeamsFiltersProps) {
    const hasActiveFilters =
        searchTerm || selectedManagers.length > 0 || selectedPositions.length > 0 || selectedLoanStatuses.length > 0;

    return (
        <div className={styles.filtersContainer}>
            <div className={styles.filtersRow}>
                {/* Search */}
                <div className={styles.searchGroup}>
                    <SearchInput
                        value={searchTerm}
                        onChange={onSearchChange}
                        placeholder="Search players, managers, teams..."
                    />
                </div>

                {/* Managers Filter */}
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Managers</label>
                    <MultiSelect
                        options={managerOptions}
                        selectedValues={selectedManagers}
                        onSelectionChange={onManagersChange}
                        placeholder="managers"
                        className={styles.multiSelect}
                        sortOptions={true}
                    />
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

                {/* Loan Status Filter */}
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Loan Status</label>
                    <MultiSelect
                        options={loanStatusOptions}
                        selectedValues={selectedLoanStatuses}
                        onSelectionChange={onLoanStatusesChange}
                        placeholder="statuses"
                        className={styles.multiSelect}
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
                        {selectedManagers.length > 0 && (
                            <span className={styles.activeFilter}>
                                {selectedManagers.length} manager{selectedManagers.length > 1 ? 's' : ''}
                            </span>
                        )}
                        {selectedPositions.length > 0 && (
                            <span className={styles.activeFilter}>
                                {selectedPositions.length} position{selectedPositions.length > 1 ? 's' : ''}
                            </span>
                        )}
                        {selectedLoanStatuses.length > 0 && (
                            <span className={styles.activeFilter}>
                                {selectedLoanStatuses.length} status{selectedLoanStatuses.length > 1 ? 'es' : ''}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
