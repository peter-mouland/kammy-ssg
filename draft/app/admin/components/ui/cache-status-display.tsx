import React, { useState } from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { DataCount } from './data-count';
import styles from './cache-status-display.module.css';

interface CacheHealthData {
    health?: {
        overall: 'healthy' | 'warning' | 'critical';
        issues?: string[];
        recommendations?: string[];
    };
    completionPercentage: number;
    counts?: {
        teams?: number;
        events?: number;
        elements?: number;
        elementSummaries?: number;
    };
    missing?: {
        teams?: boolean;
        events?: boolean;
        elements?: boolean;
        elementSummaries?: boolean;
    };
}

export const CacheStatusDisplay = () => {
    const fetcher = useFetcher();
    const [cacheData, setCacheData] = useState<CacheHealthData | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const refreshStatus = () => {
        fetcher.submit({ actionType: 'getCacheStatus' }, { method: 'post' });
        setLastRefresh(new Date());
    };

    React.useEffect(() => {
        if (!cacheData) {
            refreshStatus();
        }
    }, []);

    React.useEffect(() => {
        if (fetcher.data?.success && fetcher.data?.data) {
            setCacheData(fetcher.data.data);
        }
    }, [fetcher.data]);

    if (!cacheData) {
        return <div className={styles.loading}>Loading cache status...</div>;
    }

    const getHealthColor = (health: string) => {
        switch (health) {
            case 'healthy': return styles.healthy;
            case 'warning': return styles.warning;
            case 'critical': return styles.critical;
            default: return '';
        }
    };

    return (
        <div className={styles.container}>
            {/* Overall Health */}
            <div className={`${styles.healthCard} ${getHealthColor(cacheData.health?.overall || '')}`}>
                <div className={styles.healthHeader}>
                    <div className={styles.healthStatus}>
                        <span className={styles.healthIcon}>
                            {cacheData.health?.overall === 'healthy' ? '✅' :
                                cacheData.health?.overall === 'warning' ? '⚠️' : '❌'}
                        </span>
                        <span className={styles.healthText}>
                            {cacheData.health?.overall?.toUpperCase() || 'UNKNOWN'}
                        </span>
                    </div>
                    <span className={styles.completionText}>
                        {cacheData.completionPercentage}% Complete
                    </span>
                </div>

                {cacheData.health?.issues && cacheData.health.issues.length > 0 && (
                    <div className={styles.issuesSection}>
                        <strong>Issues:</strong>
                        <ul className={styles.issuesList}>
                            {cacheData.health.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Data Counts */}
            <div className={styles.countsGrid}>
                <DataCount
                    label="Teams"
                    count={cacheData.counts?.teams || 0}
                    missing={cacheData.missing?.teams}
                    expected={20}
                />
                <DataCount
                    label="Events"
                    count={cacheData.counts?.events || 0}
                    missing={cacheData.missing?.events}
                    expected={38}
                />
                <DataCount
                    label="Players"
                    count={cacheData.counts?.elements || 0}
                    missing={cacheData.missing?.elements}
                    expected={600}
                />
                <DataCount
                    label="Player Stats"
                    count={cacheData.counts?.elementSummaries || 0}
                    missing={cacheData.missing?.elementSummaries}
                    expected={cacheData.counts?.elements || 600}
                />
            </div>

            {/* Recommendations */}
            {cacheData.health?.recommendations && cacheData.health.recommendations.length > 0 && (
                <div className={styles.recommendationsSection}>
                    <h5 className={styles.recommendationsTitle}>💡 Recommendations:</h5>
                    <ul className={styles.recommendationsList}>
                        {cacheData.health.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Last Updated */}
            <div className={styles.refreshSection}>
                <button onClick={refreshStatus} className={styles.refreshButton}>
                    <Icons.RefreshIcon />
                    Refresh Status
                </button>
                {lastRefresh && (
                    <div className={styles.lastUpdated}>
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    );
};
