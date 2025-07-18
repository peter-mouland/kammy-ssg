/* Location: app/admin/components/sections/cache-management-section.tsx */

import { useFetcher } from 'react-router';
import type { AdminDataContext } from '../../types/admin-orchestrator-types';
import type { SystemStatusSummary } from '../../types/admin-types';
import * as Icons from '../icons/admin-icons';
import { AdminContainer } from '../layout/admin-container';
import { AdminGrid } from '../layout/admin-grid';
import { AdminSection } from '../layout/admin-section';
import { AdminButton } from '../ui/admin-button';
import { AdminMessage } from '../ui/admin-message';
import styles from './cache-management-section.module.css';

interface CacheManagementSectionProps {
    systemStatus: SystemStatusSummary;
    sharedContext: AdminDataContext;
    cacheStats?: any;
}

export function CacheManagementSection({ systemStatus, sharedContext }: CacheManagementSectionProps) {
    const fetcher = useFetcher();

    const isLoading = fetcher.state !== 'idle';
    const actionData = fetcher.data;

    const cacheStatus = sharedContext.cacheStatus;
    const lastUpdated = cacheStatus.lastUpdated ? new Date(cacheStatus.lastUpdated).toLocaleString() : 'Never';

    const handleCacheAction = (actionType: string) => {
        const formData = new FormData();
        formData.append('actionType', actionType);

        // Submit to the parent admin route, not the current nested route
        fetcher.submit(formData, {
            method: 'POST',
            action: '/admin', // This ensures we hit the parent route's action
        });
    };

    const cacheStats = null;

    const getCacheStatusColor = (health: string) => {
        switch (health) {
            case 'healthy':
                return 'healthy';
            case 'warning':
                return 'warning';
            default:
                return 'critical';
        }
    };

    const formatAge = (lastUpdated: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - lastUpdated.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
        if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`;
        if (diffMinutes > 0) return `${diffMinutes}m`;
        return 'Just now';
    };

    return (
        <AdminContainer>
            {/* Cache Management Actions */}
            <AdminSection
                title="Cache Management"
                icon={<Icons.CloudIcon />}
                description="Manage system caches and data sources"
            >
                <AdminGrid columns="auto" minWidth="250px">
                    <div className={styles.cacheActionGroup}>
                        <h4>Data Sources</h4>
                        <AdminButton
                            variant="secondary"
                            onClick={() => handleCacheAction('refreshFplData')}
                            disabled={isLoading}
                        >
                            Refresh FPL Data
                        </AdminButton>
                        <AdminButton
                            variant="secondary"
                            onClick={() => handleCacheAction('refreshSheetsData')}
                            disabled={isLoading}
                        >
                            Refresh Sheets Data
                        </AdminButton>
                    </div>

                    <div className={`${styles.cacheActionGroup} ${styles.critical}`}>
                        <h4>⚠️ Nuclear Options</h4>
                        <AdminButton
                            variant="danger"
                            onClick={() => handleCacheAction('invalidateAllCaches')}
                            disabled={isLoading}
                            requireConfirm={true}
                            confirmMessage="This will invalidate ALL caches system-wide. Are you sure?"
                        >
                            Invalidate All Caches
                        </AdminButton>
                        <AdminButton
                            variant="danger"
                            onClick={() => handleCacheAction('resetDatabase')}
                            disabled={isLoading}
                            requireConfirm={true}
                            confirmMessage="This will RESET the entire database. This cannot be undone. Are you absolutely sure?"
                        >
                            Reset Database
                        </AdminButton>

                        <AdminButton
                            variant={'primary'}
                            disabled={isLoading}
                            onClick={() => handleCacheAction('populateBootstrapData')}
                        >
                            Populate Bootstrap Data
                        </AdminButton>
                    </div>
                </AdminGrid>
            </AdminSection>

            {/* Debug Information */}
            <AdminSection
                title="Debug Information"
                icon={<Icons.DatabaseIcon />}
                description="System diagnostics and logs"
            >
                <h3 className={styles.sectionTitle}>Debug Actions</h3>

                <AdminButton
                    variant="secondary"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => window.open('/api/cache?action=status', '_blank')}
                    disabled={isLoading}
                >
                    <Icons.FileIcon />
                    View Cache Statistics
                </AdminButton>

                <AdminButton
                    variant="secondary"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => window.open('/api/cache?action=keys', '_blank')}
                    disabled={isLoading}
                >
                    <Icons.DatabaseIcon />
                    View All Cache Keys
                </AdminButton>

                <div className={styles.debugInfo}>
                    <div className={styles.debugSection}>
                        <h4>System Status Summary</h4>
                        <pre>{JSON.stringify(systemStatus.systemHealth, null, 2)}</pre>
                    </div>

                    <div className={styles.debugSection}>
                        <h4>Cache Details</h4>
                        <pre>{JSON.stringify(cacheStatus, null, 2)}</pre>
                    </div>

                    <div className={styles.debugSection}>
                        <h4>Current Context</h4>
                        <ul>
                            <li>Divisions: {sharedContext.sheetData.divisions.length}</li>
                            <li>Managers: {sharedContext.sheetData.managers.length}</li>
                            <li>Players: {sharedContext.fplData.players.length}</li>
                            <li>Current Gameweek: {systemStatus.currentGameweek?.fplEvent.id}</li>
                            <li>Draft Status: {systemStatus.draft.stage}</li>
                            <li>Pending Transfers: {systemStatus.transfers.pending}</li>
                        </ul>
                    </div>
                </div>
            </AdminSection>

            {/* Action Messages */}
            {actionData?.success && actionData.message && (
                <AdminMessage type="success">{actionData.message}</AdminMessage>
            )}
            {actionData?.error && <AdminMessage type="error">{actionData.error}</AdminMessage>}
        </AdminContainer>
    );
}
