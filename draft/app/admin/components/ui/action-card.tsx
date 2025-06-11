import React from 'react';
import { useFetcher } from 'react-router';
import styles from './action-card.module.css';

interface ActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    buttonText: string;
    actionType: string;
    onExecute: (actionType: string) => void;
    fetcher: ReturnType<typeof useFetcher>;
    recommended?: boolean;
    disabled?: boolean;
}

export const ActionCard = ({
                               title,
                               description,
                               icon,
                               buttonText,
                               actionType,
                               onExecute,
                               fetcher,
                               recommended = false,
                               disabled = false
                           }: ActionCardProps) => {
    const isLoading = fetcher.state === 'submitting' && fetcher.formData?.get('actionType') === actionType;
    const hasSuccess = fetcher.data?.success && fetcher.formData?.get('actionType') === actionType;
    const hasError = fetcher.data?.error && fetcher.formData?.get('actionType') === actionType;

    return (
        <div className={`${styles.actionCard} ${recommended ? styles.recommended : ''}`}>
            <div className={styles.actionTitle}>
                {icon}
                {title}
                {recommended && (
                    <span className={styles.recommendedBadge}>RECOMMENDED</span>
                )}
            </div>
            <div className={styles.actionDescription}>{description}</div>
            <button
                className={`${styles.actionButton} ${recommended ? styles.primary : styles.secondary}`}
                onClick={() => onExecute(actionType)}
                disabled={disabled || isLoading}
            >
                {isLoading ? (
                    <>
                        <span className={styles.spinner}></span>
                        Loading...
                    </>
                ) : hasSuccess ? (
                    '✓ Complete'
                ) : hasError ? (
                    '✗ Failed'
                ) : (
                    buttonText
                )}
            </button>

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
