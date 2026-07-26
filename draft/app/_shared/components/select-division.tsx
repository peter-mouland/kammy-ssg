/* Location: app/_shared/components/select-division.tsx */

import type { DivisionId, DivisionSheetData } from '../types/league-types';
import styles from './select-division.module.css';

interface SelectDivisionProps {
    divisions: DivisionSheetData[];
    selectedDivision: DivisionId | null;
    handleDivisionChange: (divisionId: DivisionId) => void;
}

export function SelectDivision({ divisions, selectedDivision, handleDivisionChange }: SelectDivisionProps) {
    return (
        <label htmlFor="division-select" className={styles.selectContainer}>
            <span className={styles.selectLabel}>Select Division:</span>
            <select
                id="division-select"
                value={selectedDivision || 'all'}
                onChange={(e) => handleDivisionChange(e.target.value as DivisionId)}
                className={styles.selectInput}
            >
                <option value="all">All Divisions</option>
                {divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                        {division.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
