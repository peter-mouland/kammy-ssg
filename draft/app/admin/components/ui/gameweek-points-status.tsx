import React, { useState } from 'react';
import { useFetcher } from 'react-router';
import styles from './gameweek-points-status.module.css';

interface GameweekPointsStatusData {
    currentGameweek: number;
    lastGameweek: number;
    lastGenerated?: string;
    needsUpdate: boolean;
    reason: string;
}

export const GameweekPointsStatus = () => {
    const fetcher = useFetcher();
    const [status, setStatus] = useState<GameweekPointsStatusData | null>(null);

    React.useEffect(() => {
        fetcher.submit({ actionType: 'getGameweekPointsStatus' }, { method: 'post' });
    }, []);

    React.useEffect(() => {
        if (fetcher.data?.success && fetcher.data?.data) {
            setStatus(fetcher.data.data);
        }
    }, [fetcher.data]);

    if (!status) {
        return <div className={styles.loading}>Loading points status...</div>;
    }

    return (
        <div className={styles.statusContainer}>
            <h4 className={styles.statusTitle}>
                🎯 Gameweek Points Status
            </h4>
            <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                    <div className={styles.statusLabel}>Current Gameweek:</div>
                    <div className={styles.statusValue}>{status.currentGameweek}</div>
                </div>
                <div className={styles.statusItem}>
                    <div className={styles.statusLabel}>Last Generated:</div>
                    <div className={styles.statusValue}>
                        GW{status.lastGameweek}
                        {status.lastGenerated && ` (${new Date(status.lastGenerated).toLocaleDateString()})`}
                    </div>
                </div>
                <div className={styles.statusItem}>
                    <div className={styles.statusLabel}>Status:</div>
                    <div className={`${styles.statusValue} ${status.needsUpdate ? styles.warning : styles.healthy}`}>
                        {status.needsUpdate ? '⚠️ Update Needed' : '✅ Up to Date'}
                    </div>
                </div>
            </div>
            {status.needsUpdate && (
                <div className={styles.reasonText}>
                    <strong>Reason:</strong> {status.reason}
                </div>
            )}
        </div>
    );
};
