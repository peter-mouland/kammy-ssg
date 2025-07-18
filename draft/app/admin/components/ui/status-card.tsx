/* Location: app/admin/components/ui/status-card.tsx */

// /admin/components/ui/status-card.tsx
import type React from 'react';
import styles from './status-card.module.css';

interface StatusCardProps {
    icon: React.ReactNode;
    label: string;
    percentage: string;
    status: 'healthy' | 'warning' | 'critical';
}

export const StatusCard: React.FC<StatusCardProps> = ({ icon, label, percentage, status, children }) => {
    return (
        <div className={`${styles.statusCard} ${styles[status]}`}>
            <div className={styles.statusValue}>{icon}</div>
            <div className={styles.statusLabel}>{label}</div>
            <div className={styles.statusPercentage}>{percentage}</div>
            {children}
        </div>
    );
};
