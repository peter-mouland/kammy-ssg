import React from 'react';
import styles from './status-card.module.css';

type StatusType = 'healthy' | 'warning' | 'critical';

interface StatusCardProps {
    value: string | number;
    label: string;
    percentage?: string;
    status: StatusType;
}

export const StatusCard = ({ value, label, percentage, status }: StatusCardProps) => {
    return (
        <div className={`${styles.statusCard} ${styles[status]}`}>
            <div className={styles.statusValue}>{value}</div>
            <div className={styles.statusLabel}>{label}</div>
            {percentage && (
                <div className={styles.statusPercentage}>{percentage}</div>
            )}
        </div>
    );
};
