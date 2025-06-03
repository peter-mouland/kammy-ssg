import { useFetcher } from 'react-router';
import { useState, useEffect } from 'react';
import styles from './sync-draft-button.module.css';

interface SyncDraftButtonProps {
    divisionId: string | undefined;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
    variant?: 'primary' | 'secondary';
}

export function SyncDraftButton({
                                    divisionId,
                                    disabled = false,
                                    size = 'medium',
                                    variant = 'secondary'
                                }: SyncDraftButtonProps) {
    const fetcher = useFetcher();
    const [showSuccess, setShowSuccess] = useState(false);

    const isLoading = fetcher.state === 'submitting';
    const hasError = fetcher.data?.error;
    const hasSuccess = fetcher.data?.success;

    // Show success state briefly
    useEffect(() => {
        if (hasSuccess) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [hasSuccess]);

    const handleSync = () => {
        if (disabled || isLoading || !divisionId) return;

        fetcher.submit(
            {
                actionType: 'syncDraft',
                divisionId: divisionId
            },
            { method: 'post' }
        );
    };

    const getButtonClasses = () => {
        let classes = [styles.syncButton, styles[size], styles[variant]];

        if (showSuccess) classes.push(styles.success);
        else if (hasError) classes.push(styles.error);
        else if (isLoading) classes.push(styles.loading);

        return classes.join(' ');
    };

    const getIcon = () => {
        if (isLoading) return '⏳';
        if (showSuccess) return '✅';
        if (hasError) return '❌';
        return '🔄';
    };

    const getText = () => {
        if (isLoading) return 'Syncing...';
        if (showSuccess) return 'Synced!';
        if (hasError) return 'Failed';
        return 'Sync Draft';
    };

    return (
        <div className={styles.syncButtonContainer}>
            <button
                onClick={handleSync}
                disabled={disabled || isLoading || !divisionId}
                className={getButtonClasses()}
                title={hasError ? fetcher.data?.error : 'Sync draft state from Google Sheets to Firebase'}
            >
                <span className={styles.icon}>{getIcon()}</span>
                <span className={styles.text}>{getText()}</span>
            </button>

            {/* Success/Error Messages */}
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

            {/* Sync Details */}
            {hasSuccess && fetcher.data?.data && (
                <div className={styles.syncDetails}>
                    <div>Picks: {fetcher.data.data.picksCount}</div>
                    <div>Current Pick: {fetcher.data.data.currentPick}</div>
                    <div>Status: {fetcher.data.data.isActive ? 'Active' : 'Inactive'}</div>
                </div>
            )}
        </div>
    );
}
