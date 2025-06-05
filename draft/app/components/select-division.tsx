import styles from './select-division.module.css';

interface Division {
    id: string;
    label: string;
}

interface SelectDivisionProps {
    divisions: Division[];
    selectedDivision: string | null;
    handleDivisionChange: (divisionId: string) => void;
}

export function SelectDivision({
                                   divisions,
                                   selectedDivision,
                                   handleDivisionChange
                               }: SelectDivisionProps) {
    return (
        <label htmlFor="division-select" className={styles.selectContainer}>
            <span className={styles.selectLabel}>Select Division:</span>
            <select
                id="division-select"
                value={selectedDivision || "all"}
                onChange={(e) => handleDivisionChange(e.target.value)}
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
