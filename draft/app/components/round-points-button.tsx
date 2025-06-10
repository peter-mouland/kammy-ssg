// components/round-points-button.tsx
import { useState } from 'react';
import { useFetcher } from 'react-router';
import styles from './round-points-button.module.css';

interface GameweekPointsButtonProps {
    variant?: 'primary' | 'secondary';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
}

export function GameweekPointsButton({
                                        variant = 'primary',
                                        size = 'medium',
                                        disabled = false
                                    }: GameweekPointsButtonProps) {
    const fetcher = useFetcher();
    const [summary, setSummary] = useState<any>(null);

    const isLoading = fetcher.state === 'submitting';
    const isSuccess = fetcher.data?.success;
    const error = fetcher.data?.error;

    const handleGenerateGameweekPoints = () => {
        fetcher.submit(
            { actionType: 'generateGameweekPoints' },
            { method: 'post', action: '/api/gw-points' }
        );
    };

    const handleGetStatus = () => {
        fetcher.submit(
            { actionType: 'getGameweekPointsStatus' },
            { method: 'post', action: '/api/gw-points' }
        );
    };

    // Update summary when we get status data
    if (fetcher.data?.success && fetcher.data?.data && !summary) {
        setSummary(fetcher.data.data);
    }

    const getButtonClasses = () => {
        let classes = `${styles.button} ${styles[size]} ${styles[variant]}`;

        if (isLoading) {
            classes += ` ${styles.loading}`;
        } else if (isSuccess) {
            classes += ` ${styles.success}`;
        } else if (error) {
            classes += ` ${styles.error}`;
        }

        if (disabled) {
            classes += ` ${styles.disabled}`;
        }

        return classes;
    };

    const getButtonText = () => {
        if (isLoading) return 'Generating...';
        if (isSuccess) return 'Generated!';
        if (error) return 'Failed';
        return 'Generate Round Points';
    };

    const getIcon = () => {
        if (isLoading) {
            return (
                <svg className={styles.icon} fill="none" viewBox="0 0 24 24">
                    <circle className={styles.spinnerTrack} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className={styles.spinner} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            );
        }
        if (isSuccess) {
            return (
                <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            );
        }
        if (error) {
            return (
                <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            );
        }
        return (
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        );
    };

    return (
        <div className={styles.container}>
            {/* Main Generate Button */}
            <div className={styles.buttonGroup}>
                <button
                    onClick={handleGenerateGameweekPoints}
                    disabled={disabled || isLoading}
                    className={getButtonClasses()}
                >
                    {getIcon()}
                    {getButtonText()}
                </button>

                <button
                    onClick={handleGetStatus}
                    disabled={isLoading}
                    className={styles.statusButton}
                >
                    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                </button>
            </div>

            {/* Status Message */}
            {error && (
                <div className={styles.errorMessage}>
                    <p>❌ {error}</p>
                </div>
            )}

            {isSuccess && fetcher.data?.message && (
                <div className={styles.successMessage}>
                    <p>✅ {fetcher.data.message}</p>
                </div>
            )}

            {/* Summary Information */}
            {summary && (
                <div className={styles.summaryCard}>
                    <h4 className={styles.summaryTitle}>Round Points Summary</h4>
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Players:</span>
                            <span className={styles.summaryValue}>{summary.totalPlayers}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Rounds:</span>
                            <span className={styles.summaryValue}>{summary.totalRounds}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Avg Points/Round:</span>
                            <span className={styles.summaryValue}>{summary.averagePointsPerRound.toFixed(2)}</span>
                        </div>
                        {summary.topScorer && (
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Top Scorer:</span>
                                <span className={styles.summaryValue}>
                                    {summary.topScorer.playerName} ({summary.topScorer.totalPoints} pts)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Usage Instructions */}
            <div className={styles.infoCard}>
                <p className={styles.infoText}>
                    💡 <strong>Round Points:</strong> Generates a sheet with one column per round (up to 38),
                    showing your custom scoring system points for each player's performance in each specific round.
                    Uses the same point calculation logic as gameweek points but mapped to individual fixtures.
                </p>
            </div>
        </div>
    );
}
