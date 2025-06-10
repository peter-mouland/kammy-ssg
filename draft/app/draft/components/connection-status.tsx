// components/connection-status/connection-status.tsx
import { LoadingSpinner } from '../../_shared/components/loading-overlay';
import styles from './connection-status.module.css';

interface ConnectionStatusProps {
    connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
    isRevalidating?: boolean;
    onReconnect?: () => void;
}

export function ConnectionStatus({
                                     connectionState,
                                     isRevalidating,
                                     onReconnect
                                 }: ConnectionStatusProps) {
    if (connectionState === 'connected' && !isRevalidating) {
        return (
            <div className={styles.statusContainer}>
                <div className={`${styles.indicator} ${styles.connected}`} />
                <span className={styles.statusText}>Live</span>
            </div>
        );
    }

    if (connectionState === 'connecting') {
        return (
            <div className={styles.statusContainer}>
                <LoadingSpinner size="small" />
                <span className={styles.statusText}>Connecting...</span>
            </div>
        );
    }

    if (connectionState === 'error') {
        return (
            <div className={styles.statusContainer}>
                <div className={`${styles.indicator} ${styles.error}`} />
                <button
                    onClick={onReconnect}
                    className={styles.reconnectButton}
                >
                    Reconnect
                </button>
            </div>
        );
    }

    if (isRevalidating) {
        return (
            <div className={styles.statusContainer}>
                <LoadingSpinner size="small" />
                <span className={styles.statusText}>Syncing...</span>
            </div>
        );
    }

    return null;
}

// Alert component for connection issues
interface ConnectionAlertProps {
    isConnected: boolean;
    isDraftActive: boolean;
    onReconnect: () => void;
}

export function ConnectionAlert({ isConnected, isDraftActive, onReconnect }: ConnectionAlertProps) {
    if (isConnected || !isDraftActive) {
        return null;
    }

    return (
        <div className={styles.connectionAlert}>
            ⚠️ Connection lost - You may not receive live updates.
            <button
                onClick={onReconnect}
                className={styles.alertReconnectButton}
            >
                Reconnect
            </button>
        </div>
    );
}
