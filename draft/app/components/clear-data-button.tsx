// components/clear-data-button/clear-data-button.tsx
import { useState, useCallback } from 'react';
import { useFetcher } from 'react-router';
import styles from './clear-data-button.module.css';

interface ClearProgress {
    stage: string;
    progress: number;
    total: number;
    completed: boolean;
    error?: string;
}

interface ClearDataButtonProps {
    variant?: 'all' | 'fpl-only' | 'elements-only';
    disabled?: boolean;
    onComplete?: () => void;
}

export function ClearDataButton({
                                    variant = 'all',
                                    disabled = false,
                                    onComplete
                                }: ClearDataButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [progress, setProgress] = useState<ClearProgress | null>(null);
    const [stats, setStats] = useState<Record<string, number> | null>(null);
    const fetcher = useFetcher();

    const variantConfig = {
        'all': {
            label: 'Clear All Cache Data',
            description: 'Removes all FPL data, element summaries, and cache state',
            confirmText: 'Clear Everything',
            warningLevel: 'high' as const
        },
        'fpl-only': {
            label: 'Clear FPL Cache',
            description: 'Removes bootstrap and element data only',
            confirmText: 'Clear FPL Data',
            warningLevel: 'medium' as const
        },
        'elements-only': {
            label: 'Clear Element Summaries',
            description: 'Removes individual player data only',
            confirmText: 'Clear Elements',
            warningLevel: 'low' as const
        }
    };

    const config = variantConfig[variant];

    const handleGetStats = useCallback(async () => {
        setIsClearing(true);
        try {
            const response = await fetch('/api/admin/firestore-stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to get stats:', error);
        } finally {
            setIsClearing(false);
        }
    }, []);

    const handleClearData = useCallback(async () => {
        setIsClearing(true);
        setProgress({ stage: 'Starting...', progress: 0, total: 1, completed: false });

        try {
            const response = await fetch('/api/admin/clear-firestore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ variant })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle streaming response for progress updates
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const progressData = JSON.parse(line.slice(6));
                                setProgress(progressData);
                            } catch (e) {
                                console.warn('Failed to parse progress data:', line);
                            }
                        }
                    }
                }
            }

            setShowConfirm(false);
            onComplete?.();

        } catch (error) {
            setProgress({
                stage: 'Failed',
                progress: 0,
                total: 1,
                completed: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setIsClearing(false);
            // Clear progress after a delay
            setTimeout(() => setProgress(null), 3000);
        }
    }, [variant, onComplete]);

    const handleButtonClick = () => {
        if (!showConfirm) {
            handleGetStats();
            setShowConfirm(true);
        } else {
            handleClearData();
        }
    };

    const handleCancel = () => {
        setShowConfirm(false);
        setStats(null);
    };

    return (
        <div className={styles.container}>
            <button
                onClick={handleButtonClick}
                disabled={disabled || isClearing}
                className={`${styles.button} ${styles[config.warningLevel]} ${
                    showConfirm ? styles.confirm : ''
                }`}
            >
                {isClearing ? (
                    <div className={styles.loadingContent}>
                        <div className={styles.spinner} />
                        {progress ? progress.stage : 'Loading...'}
                    </div>
                ) : (
                    showConfirm ? config.confirmText : config.label
                )}
            </button>

            {showConfirm && !isClearing && (
                <div className={styles.confirmDialog}>
                    <div className={styles.dialogContent}>
                        <h4 className={styles.dialogTitle}>
                            ⚠️ Confirm Action
                        </h4>
                        <p className={styles.dialogDescription}>
                            {config.description}
                        </p>

                        {stats && (
                            <div className={styles.statsSection}>
                                <h5>Current Data:</h5>
                                <ul className={styles.statsList}>
                                    {Object.entries(stats).map(([collection, count]) => (
                                        <li key={collection} className={styles.statsItem}>
                                            <span className={styles.statsCollection}>
                                                {collection.replace('fpl-', '').replace('-', ' ')}:
                                            </span>
                                            <span className={styles.statsCount}>
                                                {count.toLocaleString()} documents
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className={styles.warningBox}>
                            <strong>Warning:</strong> This action cannot be undone.
                            All cached data will need to be refetched from the FPL API.
                        </div>

                        <div className={styles.dialogActions}>
                            <button
                                onClick={handleCancel}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearData}
                                className={`${styles.button} ${styles[config.warningLevel]}`}
                            >
                                {config.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {progress && (
                <div className={styles.progressSection}>
                    <div className={styles.progressInfo}>
                        <span className={styles.progressStage}>{progress.stage}</span>
                        {!progress.completed && !progress.error && (
                            <span className={styles.progressPercent}>
                                {Math.round((progress.progress / progress.total) * 100)}%
                            </span>
                        )}
                    </div>

                    {!progress.completed && !progress.error && (
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{
                                    width: `${(progress.progress / progress.total) * 100}%`
                                }}
                            />
                        </div>
                    )}

                    {progress.error && (
                        <div className={styles.errorMessage}>
                            ❌ {progress.error}
                        </div>
                    )}

                    {progress.completed && (
                        <div className={styles.successMessage}>
                            ✅ {progress.stage}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Usage examples for different variants
export function ClearAllDataButton() {
    return <ClearDataButton variant="all" />;
}

export function ClearFplOnlyButton() {
    return <ClearDataButton variant="fpl-only" />;
}

export function ClearElementsOnlyButton() {
    return <ClearDataButton variant="elements-only" />;
}
