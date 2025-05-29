import styles from './action-message.module.css';

interface ActionMessageProps {
    success?: boolean;
    error?: string;
    message?: string;
}

export function ActionMessage({ success, error, message }: ActionMessageProps) {
    if (!success && !error) return null;

    return (
        <div className={styles.messageContainer}>
            {success && message && (
                <div className={styles.successMessage}>
                    <span className={styles.messageIcon}>✅</span>
                    <span className={styles.messageText}>{message}</span>
                </div>
            )}

            {error && (
                <div className={styles.errorMessage}>
                    <span className={styles.messageIcon}>❌</span>
                    <span className={styles.messageText}>{error}</span>
                </div>
            )}
        </div>
    );
}
