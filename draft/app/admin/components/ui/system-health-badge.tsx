import React from 'react';
import * as Icons from '../icons/admin-icons';
import { useCacheStatus } from '../../hooks/use-cache-status';
import styles from './system-health-badge.module.css';

type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export const SystemHealthBadge = () => {
    const { data, loading } = useCacheStatus();

    const status: HealthStatus = loading ? 'unknown' : (data?.health?.overall || 'unknown');

    const getIcon = () => {
        switch (status) {
            case 'healthy': return <Icons.CheckIcon />;
            case 'warning': return <Icons.AlertIcon />;
            case 'critical': return <Icons.AlertIcon />;
            default: return <Icons.ClockIcon />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'healthy': return 'System Healthy';
            case 'warning': return 'Minor Issues';
            case 'critical': return 'Critical Issues';
            default: return loading ? 'Checking...' : 'Status Unknown';
        }
    };

    return (
        <div className={`${styles.healthBadge} ${styles[status]}`}>
            {getIcon()}
            <span className={styles.statusText}>
                {getStatusText()}
            </span>
        </div>
    );
};
