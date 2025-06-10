

// /admin/components/sections/firebase-sync-section.tsx
import React from 'react';
import { useLoaderData, useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import styles from './firebase-sync-section.module.css';

export const FirebaseSyncSection = () => {
    const { draftState } = useLoaderData();
    const fetcher = useFetcher();

    const handleSync = () => {
        if (!draftState?.currentDivisionId) return;

        fetcher.submit(
            {
                actionType: 'syncDraft',
                divisionId: draftState.currentDivisionId
            },
            { method: 'post' }
        );
    };

    const isLoading = fetcher.state === 'submitting';
    const hasSuccess = fetcher.data?.success;
    const hasError = fetcher.data?.error;

    return (
        <div className={styles.syncContainer}>
            <button
                onClick={handleSync}
                disabled={!draftState?.currentDivisionId || !draftState?.isActive || isLoading}
                className={`${styles.actionButton} ${styles.primary}`}
            >
                {isLoading ? (
                    <>
                        <span className={styles.spinner}></span>
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

            {!draftState?.isActive && (
                <div className={styles.warningMessage}>
                    ⚠️ No active draft to sync. Start a draft first.
                </div>
            )}

            {hasSuccess && fetcher.data?.message && (
                <div className={styles.successMessage}>
                    {fetcher.data.message}
                </div>
            )}

            {hasError && (
                <div className={styles.errorMessage}>
                    {fetcher.data.error}
                </div>
            )}
        </div>
    );
};
