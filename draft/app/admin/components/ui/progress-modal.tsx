// app/admin/components/ui/progress-modal.tsx

import { useEffect } from 'react';
import { useProgressTracker } from '../../hooks/use-progress-tracker';
import type { ProgressUpdate } from '../../libs/progress-store.server';
import { ProgressBar } from './progress-bar';
import styles from './progress-modal.module.css';

interface ProgressModalProps {
    isOpen: boolean;
    jobId: string | null;
    onClose: () => void;
    onComplete?: (update: ProgressUpdate) => void;
    onError?: (update: ProgressUpdate) => void;
}

export function ProgressModal({ isOpen, jobId, onClose, onComplete, onError }: ProgressModalProps) {
    const { progress, connectionState, reconnect } = useProgressTracker({
        jobId,
        onComplete: (update) => {
            onComplete?.(update);
            setTimeout(() => {
                onClose();
            }, 3000);
        },
        onError,
    });

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen && progress?.status !== 'running') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, progress?.status]);

    if (!isOpen || !jobId) {
        return null;
    }

    const getJobTypeDisplay = (jobType: ProgressUpdate['jobType']) => {
        switch (jobType) {
            case 'all':
                return 'Regenerating All Points';
            case 'gameweek':
                return 'Regenerating Gameweek';
            case 'gameweeks':
                return 'Regenerating Gameweeks';
            default:
                return 'Processing';
        }
    };

    const getProgressVariant = () => {
        if (progress?.status === 'completed') return 'success';
        if (progress?.status === 'error') return 'error';
        return 'default';
    };

    const getStageIcon = (stage: ProgressUpdate['stage']) => {
        switch (stage) {
            case 'starting':
                return '🔄';
            case 'gameweek':
                return '📅';
            case 'division':
                return '🏆';
            case 'team':
                return '👥';
            case 'completed':
                return '✅';
            case 'error':
                return '❌';
            default:
                return '📊';
        }
    };

    const canClose = progress?.status !== 'running';

    return (
        <div className={styles.modalOverlay} onClick={canClose ? onClose : undefined}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        {progress ? getJobTypeDisplay(progress.jobType) : 'Processing...'}
                    </h2>
                    {canClose && (
                        <button className={styles.closeButton} onClick={onClose} aria-label="Close progress dialog">
                            ×
                        </button>
                    )}
                </div>

                <div className={styles.modalBody}>
                    {connectionState.status === 'error' && (
                        <div className={styles.connectionError}>
                            <span>⚠️ Connection lost</span>
                            <button className={styles.reconnectButton} onClick={reconnect}>
                                Reconnect
                            </button>
                        </div>
                    )}

                    {connectionState.status === 'connecting' && (
                        <div className={styles.connecting}>🔄 Connecting...</div>
                    )}

                    {connectionState.status === 'polling' && (
                        <div className={styles.pollingMode}>📊 Using polling mode (live updates unavailable)</div>
                    )}

                    {progress && (
                        <>
                            <div className={styles.progressSection}>
                                <ProgressBar
                                    percentage={progress.percentage}
                                    variant={getProgressVariant()}
                                    showPercentage={true}
                                />
                            </div>

                            <div className={styles.statusSection}>
                                <div className={styles.currentStatus}>
                                    <span className={styles.stageIcon}>{getStageIcon(progress.stage)}</span>
                                    <span className={styles.statusMessage}>{progress.message}</span>
                                </div>

                                {progress.details && (
                                    <div className={styles.progressDetails}>
                                        {progress.details.currentGameweek && (
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Gameweek:</span>
                                                <span className={styles.detailValue}>
                                                    {progress.details.currentGameweek}
                                                    {progress.details.totalGameweeks &&
                                                        ` of ${progress.details.totalGameweeks}`}
                                                </span>
                                            </div>
                                        )}

                                        {progress.details.currentDivision && (
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Division:</span>
                                                <span className={styles.detailValue}>
                                                    {progress.details.currentDivision}
                                                </span>
                                            </div>
                                        )}

                                        {progress.details.currentTeam && (
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Team:</span>
                                                <span className={styles.detailValue}>
                                                    {progress.details.currentTeam}
                                                </span>
                                            </div>
                                        )}

                                        {progress.details.currentPlayer && (
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Player:</span>
                                                <span className={styles.detailValue}>
                                                    {progress.details.currentPlayer}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {progress.status === 'error' && progress.error && (
                                    <div className={styles.errorMessage}>
                                        <strong>Error:</strong> {progress.error}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    {progress?.status === 'completed' && (
                        <div className={styles.successMessage}>✅ Process completed successfully!</div>
                    )}

                    {canClose && (
                        <button className={styles.closeFooterButton} onClick={onClose}>
                            {progress?.status === 'completed' ? 'Done' : 'Close'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
