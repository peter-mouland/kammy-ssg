/* Location: app/admin/components/ui/reset-draft-button.tsx */

// /admin/components/ui/reset-draft-button.tsx
import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import styles from './reset-draft-button.module.css';

interface ResetDraftButtonProps {
    divisionId: string;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
}

export const ResetDraftButton: React.FC<ResetDraftButtonProps> = ({
                                                                      divisionId,
                                                                      disabled = false,
                                                                      variant = 'danger'
                                                                  }) => {
    const fetcher = useFetcher();

    const isLoading = fetcher.state === 'submitting';
    const isDisabled = disabled || isLoading || !divisionId;

    const handleResetDraft = () => {
        if (isDisabled) return;

        // Strong confirmation for reset action
        const confirmed = window.confirm(
            `⚠️ RESET DRAFT FOR DIVISION ${divisionId}?\n\n` +
            'This will COMPLETELY CLEAR all Firebase draft data and rebuild it from Google Sheets.\n\n' +
            '• All Firebase events will be deleted\n' +
            '• All Firebase picks will be deleted\n' +
            '• Draft state will be recalculated from sheets\n\n' +
            'Use this when sync isn\'t working due to data inconsistencies.\n\n' +
            'Are you absolutely sure you want to proceed?'
        );

        if (!confirmed) return;

        // Double confirmation for destructive action
        const doubleConfirmed = window.confirm(
            'Final confirmation: This action cannot be undone.\n\n' +
            'Click OK to RESET the draft, or Cancel to abort.'
        );

        if (!doubleConfirmed) return;

        fetcher.submit(
            {
                actionType: 'resetDraft',
                divisionId
            },
            { method: 'post' }
        );
    };

    return (
        <button
            type="button"
            onClick={handleResetDraft}
            disabled={isDisabled}
            className={`${styles.adminButton} ${styles[variant]} ${isDisabled ? styles.disabled : ''}`}
            title={isDisabled ? 'Select a division first' : 'RESET: Clear all Firebase data and rebuild from sheets'}
        >
            {isLoading ? (
                <>
                    <Icons.RefreshIcon />
                    Resetting...
                </>
            ) : (
                <>
                    <Icons.TrashIcon />
                    Reset Draft
                </>
            )}
        </button>
    );
};
