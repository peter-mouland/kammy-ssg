import styles from './cache-status.module.css';

interface ActionButtonProps {
    title: string;
    description: string;
    icon: string;
    actionType: string;
    onExecute: (actionType: string) => void;
    disabled: boolean;
    recommended: boolean;
}

export function ActionButton({
                          title,
                          description,
                          icon,
                          actionType,
                          onExecute,
                          disabled,
                          recommended
                      }: ActionButtonProps) {
    return (
        <div className={`${styles.actionButton} ${recommended ? styles.recommended : ''}`}>
            <button
                onClick={() => onExecute(actionType)}
                disabled={disabled}
                className={styles.actionBtn}
            >
                <span className={styles.actionIcon}>{icon}</span>
                <div className={styles.actionContent}>
                    <div className={styles.actionTitle}>{title}</div>
                    <div className={styles.actionDescription}>{description}</div>
                </div>
                {recommended && <span className={styles.recommendedBadge}>Recommended</span>}
            </button>
        </div>
    );
}
