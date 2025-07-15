/* Location: app/admin/components/sections/firebase-sync-section.tsx */

import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { AdminMessage } from '../ui/admin-message';
import styles from './draft-sync-section.module.css';

export const DraftSyncSection = ({ draftState }) => {
    const fetcher = useFetcher();

    const handleSync = () => {
        const formData = new FormData();
        formData.append('actionType', 'processDraft');
        formData.append('draftAction', 'syncDraft');
        formData.append('divisionId', draftState.divisionId);
        fetcher.submit(formData, {
            method: 'POST',
            action: '/admin', // This ensures we hit the parent route's action
        });
    };

    const isLoading = fetcher.state === 'submitting';
    const hasSuccess = fetcher.data?.success;
    const hasError = fetcher.data?.error;

    return (
        <div className={styles.sync_container}>
            <button type="button" onClick={handleSync} className={`${styles.action_button} ${styles.primary}`}>
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
