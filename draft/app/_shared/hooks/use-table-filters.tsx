/* Location: app/_shared/hooks/use-table-filters.tsx */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

export interface Filters {
    search?: string;
    status?: string | number;
    category?: string | number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    [key: string]: string | number | undefined; // any filter
}

export interface UseTableFiltersOptions {
    defaultFilters?: Partial<Filters>;
    debounceMs?: number;
}

export interface UseTableFiltersReturn {
    filters: Filters;
    setFilter: (key: string, value: string | number | undefined) => void;
    setFilters: (newFilters: Partial<Filters>) => void;
    resetFilters: () => void;
    isUpdating: boolean;
}

export function useTableFilters(options: UseTableFiltersOptions = {}): UseTableFiltersReturn {
    const { defaultFilters = {}, debounceMs = 300 } = options;
    const [searchParams, setSearchParams] = useSearchParams();
    const timeoutRef = useRef<NodeJS.Timeout>();
    const [isUpdating, setIsUpdating] = useState(false);

    // Stabilize defaultFilters to prevent re-renders
    const stableDefaultFilters = useRef(defaultFilters);
    useEffect(() => {
        stableDefaultFilters.current = defaultFilters;
    }, [JSON.stringify(defaultFilters)]);

    // Parse initial filters from URL on mount
    const parseFiltersFromUrl = useCallback((): Filters => {
        const filters: Filters = { ...stableDefaultFilters.current };

        for (const [key, value] of searchParams.entries()) {
            if (value) {
                // Handle numeric values
                if (key === 'page' || key.endsWith('Id') || key.endsWith('Count')) {
                    const numValue = Number.parseInt(value, 10);
                    if (!Number.isNaN(numValue)) {
                        filters[key] = numValue;
                    }
                } else {
                    filters[key] = decodeURIComponent(value);
                }
            }
        }

        return filters;
    }, [searchParams]);

    // Local state for immediate UI updates
    const [localFilters, setLocalFilters] = useState<Filters>(() => parseFiltersFromUrl());

    // Update URL with debounce (replace: true to avoid history pollution)
    const updateUrlFilters = useCallback(
        (filters: Filters) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            setIsUpdating(true);

            timeoutRef.current = setTimeout(() => {
                const newSearchParams = new URLSearchParams();

                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        // Skip default values to keep URL clean
                        if (stableDefaultFilters.current[key] !== value) {
                            newSearchParams.set(key, String(value));
                        }
                    }
                });

                setSearchParams(newSearchParams, { replace: true });
                setIsUpdating(false);
            }, debounceMs);
        },
        [setSearchParams, debounceMs],
    );

    // Sync local filters with URL when local state changes
    useEffect(() => {
        updateUrlFilters(localFilters);
    }, [localFilters, updateUrlFilters]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Update a single filter
    const setFilter = useCallback((key: string, value: string | number | undefined) => {
        setLocalFilters((prev) => ({
            ...prev,
            [key]: value,
            // Reset page when other filters change (unless we're changing page itself)
            ...(key !== 'page' && { page: 1 }),
        }));
    }, []);

    // Update multiple filters at once
    const setFilters = useCallback((newFilters: Partial<Filters>) => {
        setLocalFilters((prev) => ({
            ...prev,
            ...newFilters,
        }));
    }, []);

    // Reset all filters to defaults
    const resetFilters = useCallback(() => {
        setLocalFilters({ ...stableDefaultFilters.current });
    }, []);

    return {
        filters: localFilters,
        setFilter,
        setFilters,
        resetFilters,
        isUpdating,
    };
}
