// app/admin/components/ui/progress-bar.tsx

import styles from './progress-bar.module.css';

interface ProgressBarProps {
    percentage: number;
    variant?: 'default' | 'success' | 'error';
    showPercentage?: boolean;
    className?: string;
}

export function ProgressBar({
    percentage,
    variant = 'default',
    showPercentage = true,
    className = '',
}: ProgressBarProps) {
    const clampedPercentage = Math.max(0, Math.min(100, percentage));

    return (
        <div className={`${styles.progressContainer} ${className}`}>
            <div
                className={`${styles.progressBar} ${styles[variant]}`}
                role="progressbar"
                aria-valuenow={clampedPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress: ${clampedPercentage}%`}
            >
                <div className={styles.progressFill} style={{ width: `${clampedPercentage}%` }} />
                {showPercentage && <span className={styles.progressText}>{Math.round(clampedPercentage)}%</span>}
            </div>
        </div>
    );
}
