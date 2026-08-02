/* Location: app/admin/components/sections/cache-management-section.tsx */

import { useEffect, useRef } from 'react';
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

/** Guards against a bug in the clear loop turning into an unbounded stream of deletes. */
const MAX_RESET_PASSES = 200;

export function CacheManagementSection({ systemStatus, sharedContext }: CacheManagementSectionProps) {
    const fetcher = useFetcher();
    const resetPasses = useRef(0);

    const isLoading = fetcher.state !== 'idle';
    const actionData = fetcher.data;

    const cacheStatus = sharedContext.cacheStatus;

    const handleCacheAction = (actionType: string) => {
        if (actionType === 'resetDatabase') resetPasses.current = 0;

        const formData = new FormData();
        formData.append('actionType', actionType);

        // Submit to the parent admin route, not the current nested route
        fetcher.submit(formData, {
            method: 'POST',
            action: '/admin', // This ensures we hit the parent route's action
        });
    };

    /**
     * Reset clears as much as it can inside the function's timeout and says whether more is
     * left. Collections large enough to outlast a single request -- which is what killed
     * "Reset Database" outright -- are cleared by coming back for another pass.
     */
    const resetPass = actionData?.data as { done?: boolean; deleted?: number } | undefined;
    const resetIncomplete = fetcher.state === 'idle' && resetPass?.done === false;

    // Between passes the fetcher is briefly idle; the reset is still running.
    const busy = isLoading || resetIncomplete;

    useEffect(() => {
        if (!resetIncomplete) return;
        if (resetPasses.current >= MAX_RESET_PASSES) {
            console.error('Reset stopped after', MAX_RESET_PASSES, 'passes without finishing.');
            return;
        }

        resetPasses.current += 1;
        const formData = new FormData();
        formData.append('actionType', 'resetDatabase');
        fetcher.submit(formData, { method: 'POST', action: '/admin' });
    }, [resetIncomplete, fetcher]);

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
                            disabled={busy}
                        >
                            Refresh FPL Data
                        </AdminButton>
                        <AdminButton
                            variant="secondary"
                            onClick={() => handleCacheAction('refreshSheetsData')}
                            disabled={busy}
                        >
                            Refresh Sheets Data
                        </AdminButton>
                    </div>

                    <div className={`${styles.cacheActionGroup} ${styles.critical}`}>
                        <h4>⚠️ Nuclear Options</h4>
                        <AdminButton
                            variant="danger"
                            onClick={() => handleCacheAction('invalidateAllCaches')}
                            disabled={busy}
                            requireConfirm={true}
                            confirmMessage="This will invalidate ALL caches system-wide. Are you sure?"
                        >
                            Invalidate All Caches
                        </AdminButton>
                        <AdminButton
                            variant="danger"
                            onClick={() => handleCacheAction('resetDatabase')}
                            disabled={busy}
                            requireConfirm={true}
                            confirmMessage="This will RESET the entire database. This cannot be undone. Are you absolutely sure?"
                        >
                            Reset Database
                        </AdminButton>
                    </div>
                </AdminGrid>
            </AdminSection>

            {/* Action Messages — above debug so feedback is visible without scrolling */}
            {actionData?.success && actionData.message && (
                <AdminMessage type="success">{actionData.message}</AdminMessage>
            )}
            {actionData?.error && <AdminMessage type="error">{actionData.error}</AdminMessage>}

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
                    disabled={busy}
                >
                    <Icons.FileIcon />
                    View Cache Statistics
                </AdminButton>

                <AdminButton
                    variant="secondary"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => window.open('/api/cache?action=keys', '_blank')}
                    disabled={busy}
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
        </AdminContainer>
    );
}
