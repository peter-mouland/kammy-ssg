// app/admin/components/draft-sync-status.tsx
// Component to display draft sync status between Firebase and Google Sheets

import { useEffect, useState } from 'react';
import type { DraftSyncComparison, DraftSyncDifference } from '../../../draft/types/draft-types';
import styles from './draft-sync-status.module.css';

interface DraftSyncStatusProps {
    divisions: Array<{ id: string; name: string }>;
    onSyncDivision: (divisionId: string) => Promise<void>;
    onRefresh: () => void;
}

export const DraftSyncStatus: React.FC<DraftSyncStatusProps> = ({ divisions, onSyncDivision, onRefresh }) => {
    const [comparisons, setComparisons] = useState<DraftSyncComparison[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Fetch comparison data
    const fetchComparisons = async () => {
        try {
            setError(null);
            const response = await fetch('/api/admin/draft-sync-comparisons');
            if (!response.ok) {
                throw new Error(`Failed to fetch comparisons: ${response.statusText}`);
            }
            const data = await response.json();
            setComparisons(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch comparisons');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchComparisons();
    }, []);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(fetchComparisons, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    // Handle sync for a specific division
    const handleSyncDivision = async (divisionId: string) => {
        setSyncing((prev) => ({ ...prev, [divisionId]: true }));
        try {
            await onSyncDivision(divisionId);
            // Refresh data after sync
            await fetchComparisons();
        } catch (err) {
            setError(`Failed to sync division ${divisionId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setSyncing((prev) => ({ ...prev, [divisionId]: false }));
        }
    };

    // Handle manual refresh
    const handleRefresh = () => {
        setLoading(true);
        fetchComparisons();
        onRefresh();
    };

    const getSeverityIcon = (severity: DraftSyncDifference['severity']) => {
        switch (severity) {
            case 'high':
                return '🔴';
            case 'medium':
                return '🟡';
            case 'low':
                return '🟢';
            default:
                return '⚪';
        }
    };

    const getOverallStatus = (comparison: DraftSyncComparison) => {
        if (comparison.differences.length === 0) {
            return { status: 'synced', icon: '✅', color: 'success' };
        }

        const hasHighSeverity = comparison.differences.some((diff) => diff.severity === 'high');
        if (hasHighSeverity) {
            return { status: 'critical', icon: '❌', color: 'error' };
        }

        const hasMediumSeverity = comparison.differences.some((diff) => diff.severity === 'medium');
        if (hasMediumSeverity) {
            return { status: 'warning', icon: '⚠️', color: 'warning' };
        }

        return { status: 'minor', icon: '🟡', color: 'warning' };
    };

    if (loading && comparisons.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading draft sync status...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h3>Error Loading Sync Status</h3>
                    <p>{error}</p>
                    <button onClick={handleRefresh} className={styles.retryButton}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Draft Sync Status</h2>
                <div className={styles.controls}>
                    <label className={styles.autoRefreshToggle}>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        Auto-refresh
                    </label>
                    <button onClick={handleRefresh} className={styles.refreshButton} disabled={loading}>
                        {loading ? '⟳' : '🔄'} Refresh
                    </button>
                </div>
            </div>

            <div className={styles.grid}>
                {comparisons.map((comparison) => {
                    const overallStatus = getOverallStatus(comparison);
                    if (!comparison.divisionId) {
                        throw new Error('draft-sync-status error comparison.divisionId')
                    }
                    if (!divisions) {
                        throw new Error('draft-sync-status error divisions')
                    }
                    const division = divisions?.find((d) => d.id === comparison.divisionId);
                    const isSyncing = syncing[comparison.divisionId];

                    return (
                        <div key={comparison.divisionId} className={`${styles.card} ${styles[overallStatus.color]}`}>
                            <div className={styles.cardHeader}>
                                <h3>
                                    {overallStatus.icon} {division?.name || comparison.divisionId}
                                </h3>
                                <div className={styles.statusBadge}>{overallStatus.status}</div>
                            </div>

                            <div className={styles.cardContent}>
                                <div className={styles.summary}>
                                    <div className={styles.summaryItem}>
                                        <span>Sheets Picks:</span>
                                        <span>{comparison.sheetsPicks.length}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span>Firebase Picks:</span>
                                        <span>{comparison.firebasePicks.length}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <span>Differences:</span>
                                        <span>{comparison.differences.length}</span>
                                    </div>
                                </div>

                                {comparison.differences.length > 0 && (
                                    <div className={styles.differences}>
                                        <h4>Issues Found:</h4>
                                        <div className={styles.differencesList}>
                                            {comparison.differences.map((diff, index) => (
                                                <div key={index} className={styles.difference}>
                                                    <span className={styles.severityIcon}>
                                                        {getSeverityIcon(diff.severity)}
                                                    </span>
                                                    <span className={styles.differenceDescription}>
                                                        {diff.description}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className={styles.metadata}>
                                    <div className={styles.states}>
                                        <div className={styles.stateSection}>
                                            <h5>Sheets State:</h5>
                                            {comparison.sheetsState ? (
                                                <div className={styles.stateDetails}>
                                                    <span>Pick: {comparison.sheetsState.currentPick}</span>
                                                    <span>User: {comparison.sheetsState.currentUserId}</span>
                                                    <span>
                                                        Active: {comparison.sheetsState.isActive ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className={styles.noData}>No data</span>
                                            )}
                                        </div>

                                        <div className={styles.stateSection}>
                                            <h5>Firebase State:</h5>
                                            {comparison.firebaseState ? (
                                                <div className={styles.stateDetails}>
                                                    <span>Pick: {comparison.firebaseState.currentPick}</span>
                                                    <span>User: {comparison.firebaseState.currentUserId}</span>
                                                    <span>
                                                        Active: {comparison.firebaseState.isActive ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className={styles.noData}>No data</span>
                                            )}
                                        </div>
                                    </div>

                                    {comparison.lastSyncedAt && (
                                        <div className={styles.lastSync}>
                                            Last synced: {new Date(comparison.lastSyncedAt).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <button
                                    onClick={() => handleSyncDivision(comparison.divisionId)}
                                    disabled={isSyncing}
                                    className={`${styles.syncButton} ${comparison.differences.length > 0 ? styles.urgent : ''}`}
                                >
                                    {isSyncing ? '⟳ Syncing...' : '🔄 Sync Division'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {comparisons.length === 0 && (
                <div className={styles.empty}>
                    <p>No divisions found or no draft data available.</p>
                </div>
            )}
        </div>
    );
};
