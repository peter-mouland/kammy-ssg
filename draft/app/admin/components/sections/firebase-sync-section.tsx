/* Location: app/admin/components/sections/firebase-sync-section.tsx */

import { useFetcher, useLoaderData } from 'react-router';
import type { AdminDashboardData } from '../../types/admin-types';
import * as Icons from '../icons/admin-icons';
import { AdminMessage } from '../ui/admin-message';
import styles from './firebase-sync-section.module.css';

export const FirebaseSyncSection = () => {
    const data = useLoaderData() as AdminDashboardData | null;
    const fetcher = useFetcher();
    const draftState = data?.draftState;

    const handleSync = () => {
        if (!draftState?.currentDivisionId) return;

        fetcher.submit(
            {
                actionType: 'syncDraft',
                divisionId: draftState.currentDivisionId,
            },
            {
                method: 'post', // Submit to current route (draft)
            },
        );
    };

    const isLoading = fetcher.state === 'submitting';
    const hasSuccess = fetcher.data?.success;
    const hasError = fetcher.data?.error;

    return (
        <div className={styles.sync_container}>
            <button
                type="button"
                onClick={handleSync}
                disabled={!draftState?.currentDivisionId || !draftState?.isActive || isLoading}
                className={`${styles.action_button} ${styles.primary}`}
            >
                {isLoading ? (
                    <>
                        <span className={styles.spinner} />
                        Syncing...
                    </>
                ) : hasSuccess ? (
                    <>
                        <Icons.CheckIcon />
                        Synced!
                    </>
                ) : hasError ? (
                    <>
                        <Icons.AlertIcon />
                        Failed
                    </>
                ) : (
                    <>
                        <Icons.SyncIcon />
                        Sync Draft
                    </>
                )}
            </button>

            {hasSuccess && fetcher.data?.message && <AdminMessage type="success">{fetcher.data.message}</AdminMessage>}

            {hasError && <AdminMessage type="error">{fetcher.data.error}</AdminMessage>}
        </div>
    );
};
