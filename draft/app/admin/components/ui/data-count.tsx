import React from 'react';
import styles from './data-count.module.css';

interface DataCountProps {
    label: string;
    count: number;
    missing?: boolean;
    expected?: number;
}

export const DataCount = ({ label, count, missing, expected }: DataCountProps) => {
    const percentage = expected && expected > 0 ? Math.round((count / expected) * 100) : 0;

    return (
        <div className={`${styles.statusCard} ${missing ? styles.warning : styles.healthy}`}>
            <div className={styles.statusValue}>{count.toLocaleString()}</div>
            <div className={styles.statusLabel}>{label}</div>
            {!missing && expected && (
                <div className={styles.statusPercentage}>{percentage}%</div>
            )}
        </div>
    );
};
