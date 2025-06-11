// /admin/components/ui/status-card.tsx
import React from 'react';
import styles from './status-card.module.css';

export interface StatusCardProps {
    icon: string;
    label: string;
    percentage: string;
    status: 'healthy' | 'warning' | 'critical';
}

export const StatusCard: React.FC<StatusCardProps> = ({
                                                          icon,
                                                          label,
                                                          percentage,
                                                          status
                                                      }) => {
    return (
        <div className={`${styles.statusCard} ${styles[status]}`}>
            <div className={styles.statusValue}>
                {icon}
            </div>
            <div className={styles.statusLabel}>
                {label}
            </div>
            <div className={styles.statusPercentage}>
                {percentage}
            </div>
        </div>
    );
};
