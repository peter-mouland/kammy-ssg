/* Location: app/admin/components/ui/gameweek-points-status.tsx */

import type { SystemStatusSummary } from '../../types/admin-types';
import styles from './gameweek-points-status.module.css';

interface GameweekPointsStatusData {
    systemStatus: SystemStatusSummary;
}

export const GameweekPointsStatus = ({ systemStatus }: GameweekPointsStatusData) => {
    return (
        <div className={styles.statusContainer}>
            <h4 className={styles.statusTitle}>🎯 Gameweek Points Status</h4>
            <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                    <div className={styles.statusLabel}>Current Gameweek:</div>
                    <div className={styles.statusValue}>{systemStatus.currentGameweek.fplEvent.id}</div>
                </div>
                <div className={styles.statusItem}>
                    <div className={styles.statusLabel}>Last Generated:</div>
                    <div className={styles.statusValue}>
                        GW{systemStatus.gameweekProcessing.lastProcessedGameweek}
                        {systemStatus.gameweekProcessing.lastProcessedGameweek &&
                            ' (systemStatus.gameweekProcessing.lastGenerated)'}
                    </div>
                </div>
                <div className={styles.statusItem}>
                    <div className={styles.statusLabel}>Status:</div>
                    <div
                        className={`${styles.statusValue} ${systemStatus.gameweekProcessing.isUpToDate ? styles.healthy : styles.warning}`}
                    >
                        {systemStatus.gameweekProcessing.isUpToDate ? '✅ Up to Date' : '⚠️ Update Needed'}
                    </div>
                </div>
            </div>
            {!systemStatus.gameweekProcessing.isUpToDate && (
                <div className={styles.reasonText}>
                    <strong>Reason:</strong> {systemStatus.gameweekProcessing.reason}
                </div>
            )}
        </div>
    );
};
