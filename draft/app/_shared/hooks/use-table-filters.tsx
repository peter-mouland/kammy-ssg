import { useSearchParams } from 'react-router';
import { useState, useEffect, useCallback, useRef } from 'react';

export interface TableFilters {
    search?: string;
    status?: string;
    category?: string;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    [key: string]: string | number | undefined;
}

export interface UseTableFiltersOptions {
    defaultFilters?: Partial<TableFilters>;
    debounceMs?: number;
}

export interface UseTableFiltersReturn {
    filters: TableFilters;
    setFilter: (key: string, value: string | number | undefined) => void;
    setFilters: (newFilters: Partial<TableFilters>) => void;
    resetFilters: () => void;
    isUpdating: boolean;
}

export function useTableFilters(
    options: UseTableFiltersOptions = {}
): UseTableFiltersReturn {
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
    const parseFiltersFromUrl = useCallback((): TableFilters => {
        const filters: TableFilters = { ...stableDefaultFilters.current };

        for (const [key, value] of searchParams.entries()) {
            if (value) {
                // Handle numeric values
                if (key === 'page' || key.endsWith('Id') || key.endsWith('Count')) {
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue)) {
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
    const [localFilters, setLocalFilters] = useState<TableFilters>(() =>
        parseFiltersFromUrl()
    );

    // Update URL with debounce (replace: true to avoid history pollution)
    const updateUrlFilters = useCallback((filters: TableFilters) => {
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
    }, [setSearchParams, debounceMs]);

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
        setLocalFilters(prev => ({
            ...prev,
            [key]: value,
            // Reset page when other filters change (unless we're changing page itself)
            ...(key !== 'page' && { page: 1 })
        }));
    }, []);

    // Update multiple filters at once
    const setFilters = useCallback((newFilters: Partial<TableFilters>) => {
        setLocalFilters(prev => ({
            ...prev,
            ...newFilters
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
        isUpdating
    };
}
