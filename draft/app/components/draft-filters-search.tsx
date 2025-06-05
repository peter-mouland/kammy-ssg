// components/draft-filters-search.tsx
import React from 'react';
import styles from './draft-filters-search.module.css';

interface DraftFiltersSearchProps {
    searchTerm: string;
    onSearchChange: (search: string) => void;
    placeholder?: string;
    className?: string;
}

export function DraftFiltersSearch({
                                       searchTerm,
                                       onSearchChange,
                                       placeholder = "Search players...",
                                       className
                                   }: DraftFiltersSearchProps) {
    return (
        <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`${styles.searchInput} ${className || ''}`}
        />
    );
}
