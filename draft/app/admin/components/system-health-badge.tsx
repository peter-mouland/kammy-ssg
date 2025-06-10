import React, { useState } from 'react';
import { useFetcher } from 'react-router';
import * as Icons from './admin-icons';
import styles from './system-health-badge.module.css';

type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export const SystemHealthBadge = () => {
    const fetcher = useFetcher();
    const [status, setStatus] = useState<HealthStatus>('unknown');

    React.useEffect(() => {
        // Auto-load cache status on mount
        if (!fetcher.data && fetcher.state === 'idle') {
            fetcher.submit({ actionType: 'getCacheStatus' }, { method: 'post' });
        }
    }, []);

    React.useEffect(() => {
        if (fetcher.data?.success && fetcher.data?.data?.health) {
            setStatus(fetcher.data.data.health.overall);
        }
    }, [fetcher.data]);

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
            default: return 'Checking...';
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
