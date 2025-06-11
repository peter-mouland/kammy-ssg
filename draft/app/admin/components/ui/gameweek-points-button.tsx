import React from 'react';
import { useFetcher } from 'react-router';
import styles from './gameweek-points-button.module.css';
import * as Icons from '../icons/admin-icons';

export const GameweekPointsButton = () => {
    const fetcher = useFetcher();

    const handleGenerateGameweekPoints = () => {
        fetcher.submit(
            { actionType: 'generateGameweekPoints' },
            { method: 'post', action: '/api/gw-points' }
        );
    };

    const isLoading = fetcher.state === 'submitting';
    const isSuccess = fetcher.data?.success;
    const error = fetcher.data?.error;

    return (
        <div className={styles.container}>
            <button
                onClick={handleGenerateGameweekPoints}
                disabled={isLoading}
                className={`${styles.actionButton} ${styles.primary}`}
            >
                {isLoading ? (
                    <>
                        <span className={styles.spinner}></span>
                        Generating...
                    </>
                ) : isSuccess ? (
                    <>
                        <Icons.CheckIcon />
                        Generated!
                    </>
                ) : error ? (
                    <>
                        <Icons.AlertIcon />
                        Failed
                    </>
                ) : (
                    <>
                        <Icons.TargetIcon />
                        Generate Round Points
                    </>
                )}
            </button>

            {isSuccess && fetcher.data?.message && (
                <div className={styles.successMessage}>
                    {fetcher.data.message}
                </div>
            )}

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}
        </div>
    );
};
