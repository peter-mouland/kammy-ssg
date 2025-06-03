// components/loading-overlay/loading-overlay.tsx
import styles from './loading-overlay.module.css';
import { Timer } from './timer';

interface LoadingOverlayProps {
    show: boolean;
}

export function LoadingOverlay({ show }: LoadingOverlayProps) {
    if (!show) return null;

    return (
        <div className={styles.progressBar}>
            <div className={styles.progressIndicator} />
        </div>
    );
}

// Loading spinner component
// import styles from './loading-spinner.module.css';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
}

export function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
    return (
        <div className={styles.container}>
            <div className={`${styles.spinner} ${styles[size]}`} />
            {message && (
                <div className={styles.message}>
                    {message}
                </div>
            )}
        </div>
    );
}

// Turn alert component
interface TurnAlertProps {
    isUserTurn: boolean;
    isSubmitting: boolean;
}

export function TurnAlert({ isUserTurn, isSubmitting }: TurnAlertProps) {
    if (!isUserTurn) return null;

    return (
        <div className={styles.turnAlert}>
            <h3 className={styles.turnTitle}>
                🎯 It's Your Turn!
            </h3>
            <div className={styles.timer}>
                <Timer minutesPerPick={2.5}/>
            </div>

            {isSubmitting && (
                <div className={styles.submittingIndicator}>
                    <LoadingSpinner size="small" message="Making pick..." />
                </div>
            )}
        </div>
    );
}
