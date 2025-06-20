// /admin/components/ui/commit-teams-button.tsx
import type React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import styles from './commit-teams-button.module.css';

interface CommitTeamsButtonProps {
    divisionId: string;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
}

export const CommitTeamsButton: React.FC<CommitTeamsButtonProps> = ({
    divisionId,
    disabled = false,
    variant = 'primary',
}) => {
    const fetcher = useFetcher();

    const isLoading = fetcher.state === 'submitting';
    const isDisabled = disabled || isLoading || !divisionId;

    const handleCommitTeams = () => {
        if (isDisabled) return;

        // Confirm before committing
        const confirmed = window.confirm(
            `Are you sure you want to commit all drafted teams for division ${divisionId} to Firestore?\n\n` +
                'This will overwrite any existing team data for this division.',
        );

        if (!confirmed) return;

        fetcher.submit(
            {
                actionType: 'commitTeamsToFirestore',
                divisionId,
            },
            { method: 'post' },
        );
    };

    return (
        <button
            type="button"
            onClick={handleCommitTeams}
            disabled={isDisabled}
            className={`${styles.commitButton} ${styles[variant]} ${isDisabled ? styles.disabled : ''}`}
            title={isDisabled ? 'Select a division first' : 'Commit drafted teams to Firestore'}
        >
            {isLoading ? (
                <>
                    <Icons.RefreshIcon />
                    Committing...
                </>
            ) : (
                <>
                    <Icons.DatabaseIcon />
                    Commit Teams to Firestore
                </>
            )}
        </button>
    );
};
