// components/draft-filters.tsx
import React from 'react';
import styles from './draft-filters.module.css';

interface DraftFiltersProps {
    hiddenCount: number;
    violations: string[];
}

export function DraftFilters({ hiddenCount, violations }: DraftFiltersProps) {
    if (hiddenCount === 0) {
        return null;
    }

    return (
        <div className={styles.draftFilters}>
            <div className={styles.filtersTitle}>
                🚫 {hiddenCount} players hidden due to:
            </div>
            <ul className={styles.violationsList}>
                {violations.map((violation, index) => (
                    <li key={index}>{violation}</li>
                ))}
            </ul>
        </div>
    );
}
