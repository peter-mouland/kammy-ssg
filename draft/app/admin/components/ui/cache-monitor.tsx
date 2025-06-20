// /admin/components/ui/cache-monitor.tsx
import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { AdminMessage } from './admin-message';
import styles from './cache-monitor.module.css';

interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    hitRate: string;
    cacheSize: number;
    maxSize: number;
    keys: string[];
    keysByPattern: {
        draftState: string[];
        draftPicks: string[];
        userTeams: string[];
        draftOrders: string[];
        divisions: string[];
    };
}

interface CacheMonitorProps {
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export const CacheMonitor: React.FC<CacheMonitorProps> = ({ autoRefresh = false, refreshInterval = 30000 }) => {
    const statsFetcher = useFetcher<{ success: boolean; data?: CacheStats; error?: string }>();
    const clearFetcher = useFetcher();

    // Auto-refresh logic
    React.useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(() => {
                if (statsFetcher.state === 'idle') {
                    loadStats();
                }
            }, refreshInterval);

            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval, statsFetcher.state]);

    // Load stats on mount
    React.useEffect(() => {
        loadStats();
    }, []);

    const loadStats = () => {
        statsFetcher.submit({ actionType: 'getCacheStats' }, { method: 'post' });
    };

    const clearCache = () => {
        if (window.confirm('Are you sure you want to clear all cache? This will force fresh data loads.')) {
            clearFetcher.submit({ actionType: 'clearCache' }, { method: 'post' });
        }
    };

    const stats = statsFetcher.data?.data;
    const isLoading = statsFetcher.state === 'submitting';
    const isClearingCache = clearFetcher.state === 'submitting';

    return (
        <div className={styles.cacheMonitor}>
            <div className={styles.header}>
                <h3 className={styles.title}>
                    <Icons.DatabaseIcon />
                    Sheets Cache Monitor
                </h3>
                <div className={styles.actions}>
                    <button onClick={loadStats} disabled={isLoading} className={`${styles.button} ${styles.refresh}`}>
                        <Icons.RefreshIcon />
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </button>
                    <button
                        onClick={clearCache}
                        disabled={isClearingCache}
                        className={`${styles.button} ${styles.clear}`}
                    >
                        <Icons.AlertIcon />
                        {isClearingCache ? 'Clearing...' : 'Clear Cache'}
                    </button>
                </div>
            </div>

            {statsFetcher.data?.error && (
                <AdminMessage type="error">Error loading cache stats: {statsFetcher.data.error}</AdminMessage>
            )}

            {clearFetcher.data?.success && <AdminMessage type="success">Cache cleared successfully</AdminMessage>}

            {clearFetcher.data?.error && (
                <AdminMessage type="error">Error clearing cache: {clearFetcher.data.error}</AdminMessage>
            )}

            {stats && (
                <div className={styles.statsGrid}>
                    {/* Performance Stats */}
                    <div className={styles.statCard}>
                        <h4 className={styles.statTitle}>Performance</h4>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Hit Rate:</span>
                            <span
                                className={`${styles.statValue} ${
                                    Number.parseFloat(stats.hitRate) > 70 ? styles.good : styles.warning
                                }`}
                            >
                                {stats.hitRate}
                            </span>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Cache Hits:</span>
                            <span className={styles.statValue}>{stats.hits}</span>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Cache Misses:</span>
                            <span className={styles.statValue}>{stats.misses}</span>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Evictions:</span>
                            <span className={styles.statValue}>{stats.evictions}</span>
                        </div>
                    </div>

                    {/* Memory Usage */}
                    <div className={styles.statCard}>
                        <h4 className={styles.statTitle}>Memory Usage</h4>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Cache Size:</span>
                            <span className={styles.statValue}>
                                {stats.cacheSize} / {stats.maxSize}
                            </span>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${(stats.cacheSize / stats.maxSize) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Cache Breakdown */}
                    <div className={styles.statCard}>
                        <h4 className={styles.statTitle}>Cache Breakdown</h4>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Draft State:</span>
                            <span className={styles.statValue}>{stats.keysByPattern.draftState.length}</span>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Draft Picks:</span>
                            <span className={styles.statValue}>{stats.keysByPattern.draftPicks.length}</span>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>User Teams:</span>
                            <span className={styles.statValue}>{stats.keysByPattern.userTeams.length}</span>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Draft Orders:</span>
                            <span className={styles.statValue}>{stats.keysByPattern.draftOrders.length}</span>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Divisions:</span>
                            <span className={styles.statValue}>{stats.keysByPattern.divisions.length}</span>
                        </div>
                    </div>

                    {/* Cache Keys (collapsible) */}
                    <div className={styles.statCard}>
                        <details className={styles.details}>
                            <summary className={styles.statTitle}>All Cache Keys ({stats.keys.length})</summary>
                            <div className={styles.keyList}>
                                {stats.keys.map((key, index) => (
                                    <div key={index} className={styles.keyItem}>
                                        {key}
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                </div>
            )}

            {autoRefresh && (
                <div className={styles.autoRefresh}>
                    <Icons.RefreshIcon />
                    Auto-refreshing every {refreshInterval / 1000}s
                </div>
            )}
        </div>
    );
};
