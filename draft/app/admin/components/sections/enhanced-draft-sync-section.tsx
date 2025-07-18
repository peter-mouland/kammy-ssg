// app/admin/components/sections/enhanced-draft-sync-section.tsx
// Enhanced sync section that uses server-side data instead of client-side fetch

import { useFetcher } from 'react-router';
import type { AdminDataContext } from '../../types/admin-orchestrator-types';
import type { AdminDashboardData } from '../../types/admin-types';
import * as Icons from '../icons/admin-icons';
import { AdminGrid } from '../layout/admin-grid';
import { AdminButton } from '../ui/admin-button';
import { AdminMessage } from '../ui/admin-message';
import { StatusCard } from '../ui/status-card';
import styles from './enhanced-draft-sync-section.module.css';

interface EnhancedDraftSyncSectionProps {
    divisions: AdminDashboardData['divisions'];
    draftStates: AdminDashboardData['draftStates'];
    draftStatus: AdminDashboardData['draftStatus'];
    draftSyncComparisons?: AdminDataContext['draftSyncComparisons']; // Server-side data
}

export const EnhancedDraftSyncSection = ({
    divisions,
    draftStates,
    draftStatus,
    draftSyncComparisons,
}: EnhancedDraftSyncSectionProps) => {
    const fetcher = useFetcher();

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

    const getOverallStatus = (comparison: NonNullable<typeof draftSyncComparisons>[0]) => {
        if (comparison.differences.length === 0) {
            return { status: 'synced', icon: '✅', severity: 'success' as const };
        }

        const hasHighSeverity = comparison.differences.some((diff) => diff.severity === 'high');
        if (hasHighSeverity) {
            return { status: 'critical', icon: '❌', severity: 'error' as const };
        }

        return { status: 'warning', icon: '⚠️', severity: 'warning' as const };
    };

    const isLoading = fetcher.state === 'submitting';

    // Handle case where sync comparison data is not loaded
    if (!draftSyncComparisons) {
        return (
            <div className={styles.container}>
                <AdminMessage type="info">Loading sync status...</AdminMessage>
                <AdminButton variant="secondary" onClick={() => window.location.reload()} icon={<Icons.RefreshIcon />}>
                    Refresh Page
                </AdminButton>
            </div>
        );
    }

    // Handle case where sync comparison data failed to load
    if (!Array.isArray(draftSyncComparisons)) {
        return (
            <div className={styles.container}>
                <AdminMessage type="error">Failed to load sync comparison data</AdminMessage>
                <AdminButton variant="secondary" onClick={() => window.location.reload()} icon={<Icons.RefreshIcon />}>
                    Retry
                </AdminButton>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Sync Status Grid */}
            <AdminGrid columns="3" minWidth="300px">
                {divisions.map((division) => {
                    const comparison = draftSyncComparisons.find((c) => c.divisionId === division.id);
                    const overallStatus = comparison
                        ? getOverallStatus(comparison)
                        : { status: 'unknown', icon: '❓', severity: 'info' as const };

                    return (
                        <StatusCard
                            key={division.id}
                            title={division.label}
                            status={overallStatus.severity}
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
                                                Last synced:{' '}
                                                {new Date(comparison.lastSyncedAt).toLocaleTimeString('en-gb')}
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
                                    {isLoading ? 'Syncing...' : `Sync ${division.label}`}
                                </AdminButton>
                            </div>
                        </StatusCard>
                    );
                })}
            </AdminGrid>

            {/* Action Messages */}
            {fetcher.data?.success && <AdminMessage type="success">{fetcher.data.message}</AdminMessage>}
            {fetcher.data?.error && <AdminMessage type="error">{fetcher.data.error}</AdminMessage>}

            {/* Refresh section */}
            <div className={styles.refreshSection}>
                <AdminButton
                    variant="secondary"
                    onClick={() => window.location.reload()}
                    icon={<Icons.RefreshIcon />}
                    disabled={isLoading}
                >
                    Refresh Sync Status
                </AdminButton>
                <small style={{ color: '#6b7280', marginLeft: '1rem' }}>
                    Sync data loaded server-side at page load. Refresh to get latest status.
                </small>
            </div>
        </div>
    );
};
