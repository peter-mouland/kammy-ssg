// app/admin/components/sections/enhanced-draft-sync-section.tsx
// Enhanced sync section that works with existing admin UI components

import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
import type { AdminDashboardData } from '../../types/admin-types';
import * as Icons from '../icons/admin-icons';
import { AdminGrid } from '../layout/admin-grid';
import { AdminButton } from '../ui/admin-button';
import { AdminMessage } from '../ui/admin-message';
import { StatusCard } from '../ui/status-card';
import styles from './enhanced-draft-sync-section.module.css';

interface DraftSyncComparison {
    divisionId: string;
    sheetsState: any;
    firebaseState: any;
    sheetsPicks: any[];
    firebasePicks: any[];
    differences: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
    }>;
    lastSyncedAt?: number;
}

interface EnhancedDraftSyncSectionProps {
    divisions: AdminDashboardData['divisions'];
    draftState: AdminDashboardData['draftState'];
    draftStatus: AdminDashboardData['draftStatus'];
}

export const EnhancedDraftSyncSection = ({ divisions, draftState, draftStatus }: EnhancedDraftSyncSectionProps) => {
    const fetcher = useFetcher();
    const [comparisons, setComparisons] = useState<DraftSyncComparison[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch comparison data
    const fetchComparisons = async () => {
        try {
            const response = await fetch('/api/admin/draft-sync-comparisons');
            if (response.ok) {
                const data = await response.json();
                setComparisons(data);
            }
        } catch (error) {
            console.error('Failed to fetch sync comparisons:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchComparisons();
    }, []);

    // Handle sync for a specific division
    const handleSyncDivision = (divisionId: string) => {
        const formData = new FormData();
        formData.append('actionType', 'processDraft');
        formData.append('draftAction', 'syncDraft');
        formData.append('divisionId', divisionId);

        fetcher.submit(formData, {
            method: 'POST',
            action: '/admin',
        });
    };

    const getOverallStatus = (comparison: DraftSyncComparison) => {
        if (comparison.differences.length === 0) {
            return { status: 'synced', icon: '✅', severity: 'success' };
        }

        const hasHighSeverity = comparison.differences.some((diff) => diff.severity === 'high');
        if (hasHighSeverity) {
            return { status: 'critical', icon: '❌', severity: 'error' };
        }

        return { status: 'warning', icon: '⚠️', severity: 'warning' };
    };

    const isLoading = fetcher.state === 'submitting';

    if (loading && comparisons.length === 0) {
        return <AdminMessage type="info">Loading sync status...</AdminMessage>;
    }

    return (
        <div className={styles.container}>
            {/* Sync Status Grid */}
            <AdminGrid columns="3" minWidth="300px">
                {divisions.map((division) => {
                    const comparison = comparisons.find((c) => c.divisionId === division.id);
                    const overallStatus = comparison
                        ? getOverallStatus(comparison)
                        : { status: 'unknown', icon: '❓', severity: 'info' };

                    return (
                        <StatusCard
                            key={division.id}
                            title={division.label}
                            status={overallStatus.severity as any}
                            icon={overallStatus.icon}
                        >
                            <div className={styles.cardContent}>
                                {comparison ? (
                                    <>
                                        <div className={styles.stats}>
                                            <div className={styles.stat}>
                                                <span>Sheets Picks:</span>
                                                <span>{comparison.sheetsPicks.length}</span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span>Firebase Picks:</span>
                                                <span>{comparison.firebasePicks.length}</span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span>Issues:</span>
                                                <span
                                                    className={
                                                        comparison.differences.length > 0 ? styles.hasIssues : ''
                                                    }
                                                >
                                                    {comparison.differences.length}
                                                </span>
                                            </div>
                                        </div>

                                        {comparison.differences.length > 0 && (
                                            <ul className={styles.issues}>
                                                {comparison.differences.slice(0, 2).map((diff, index) => (
                                                    <li key={index} className={styles.issue}>
                                                        <span className={styles.severityIcon}>
                                                            {diff.severity === 'high'
                                                                ? '🔴'
                                                                : diff.severity === 'medium'
                                                                  ? '🟡'
                                                                  : '🟢'}
                                                        </span>
                                                        <span className={styles.issueText}>{diff.description}</span>
                                                    </li>
                                                ))}
                                                {comparison.differences.length > 2 && (
                                                    <div className={styles.moreIssues}>
                                                        +{comparison.differences.length - 2} more issues
                                                    </div>
                                                )}
                                            </ul>
                                        )}

                                        {comparison.lastSyncedAt && (
                                            <div className={styles.lastSync}>
                                                Last synced: {new Date(comparison.lastSyncedAt).toLocaleTimeString()}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className={styles.noData}>No sync data available</div>
                                )}

                                <AdminButton
                                    variant={comparison?.differences.length > 0 ? 'danger' : 'secondary'}
                                    onClick={() => handleSyncDivision(division.id)}
                                    disabled={isLoading}
                                    icon={<Icons.SyncIcon />}
                                    className={styles.syncButton}
                                >
                                    Sync {division.label}
                                </AdminButton>
                            </div>
                        </StatusCard>
                    );
                })}
            </AdminGrid>

            {/* Action Messages */}
            {fetcher.data?.success && <AdminMessage type="success">{fetcher.data.message}</AdminMessage>}
            {fetcher.data?.error && <AdminMessage type="error">{fetcher.data.error}</AdminMessage>}
        </div>
    );
};
