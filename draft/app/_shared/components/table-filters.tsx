import React from 'react';
import type { TableFilters } from '../hooks/use-table-filters';
import styles from './table-filters.module.css';

export interface TableFiltersProps {
    filters: TableFilters;
    onFilterChange: (key: string, value: string | number | undefined) => void;
    onFiltersChange: (filters: Partial<TableFilters>) => void;
    onReset: () => void;
    isUpdating?: boolean;
    statusOptions?: Array<{ value: string; label: string }>;
    categoryOptions?: Array<{ value: string; label: string }>;
    showSearch?: boolean;
    showStatus?: boolean;
    showCategory?: boolean;
    showSort?: boolean;
}

export function TableFilters({
                                 filters,
                                 onFilterChange,
                                 onFiltersChange,
                                 onReset,
                                 isUpdating = false,
                                 statusOptions = [],
                                 categoryOptions = [],
                                 showSearch = true,
                                 showStatus = true,
                                 showCategory = true,
                                 showSort = true
                             }: TableFiltersProps) {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange('search', e.target.value || undefined);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange('status', e.target.value || undefined);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange('category', e.target.value || undefined);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const [sortBy, sortOrder] = e.target.value.split(':');
        onFiltersChange({
            sortBy: sortBy || undefined,
            sortOrder: (sortOrder as 'asc' | 'desc') || undefined
        });
    };

    const getSortValue = () => {
        if (filters.sortBy && filters.sortOrder) {
            return `${filters.sortBy}:${filters.sortOrder}`;
        }
        return '';
    };

    const hasActiveFilters = () => {
        return Boolean(
            filters.search ||
            filters.status ||
            filters.category ||
            filters.sortBy
        );
    };

    return (
        <div className={styles.filtersContainer}>
            <div className={styles.filtersRow}>
                {showSearch && (
                    <div className={styles.filterGroup}>
                        <label htmlFor="search" className={styles.filterLabel}>
                            Search
                        </label>
                        <input
                            id="search"
                            type="text"
                            value={filters.search || ''}
                            onChange={handleSearchChange}
                            placeholder="Search..."
                            className={styles.searchInput}
                        />
                    </div>
                )}

                {showStatus && statusOptions.length > 0 && (
                    <div className={styles.filterGroup}>
                        <label htmlFor="status" className={styles.filterLabel}>
                            Status
                        </label>
                        <select
                            id="status"
                            value={filters.status || ''}
                            onChange={handleStatusChange}
                            className={styles.selectInput}
                        >
                            <option value="">All Statuses</option>
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {showCategory && categoryOptions.length > 0 && (
                    <div className={styles.filterGroup}>
                        <label htmlFor="category" className={styles.filterLabel}>
                            Category
                        </label>
                        <select
                            id="category"
                            value={filters.category || ''}
                            onChange={handleCategoryChange}
                            className={styles.selectInput}
                        >
                            <option value="">All Categories</option>
                            {categoryOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {showSort && (
                    <div className={styles.filterGroup}>
                        <label htmlFor="sort" className={styles.filterLabel}>
                            Sort By
                        </label>
                        <select
                            id="sort"
                            value={getSortValue()}
                            onChange={handleSortChange}
                            className={styles.selectInput}
                        >
                            <option value="">Default</option>
                            <option value="name:asc">Name A-Z</option>
                            <option value="name:desc">Name Z-A</option>
                            <option value="createdAt:desc">Newest First</option>
                            <option value="createdAt:asc">Oldest First</option>
                            <option value="updatedAt:desc">Recently Updated</option>
                        </select>
                    </div>
                )}
            </div>

            <div className={styles.filtersActions}>
                {hasActiveFilters() && (
                    <button
                        type="button"
                        onClick={onReset}
                        className={styles.resetButton}
                        disabled={isUpdating}
                    >
                        Clear Filters
                    </button>
                )}

                {isUpdating && (
                    <span className={styles.updatingIndicator}>
                        Updating...
                    </span>
                )}
            </div>
        </div>
    );
}
