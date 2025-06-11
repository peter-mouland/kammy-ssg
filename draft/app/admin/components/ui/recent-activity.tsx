import type { DivisionData } from "../types";

import styles from './recent-activity.module.css';

interface RecentActivityProps {
    currentGameweek: number;
    divisions: DivisionData[];
}

export function RecentActivity({ currentGameweek, divisions }: RecentActivityProps) {
    const activities = [
        {
            title: `Gameweek ${currentGameweek} Started`,
            description: 'New player stats available',
            type: 'info'
        },
        {
            title: 'League Updated',
            description: 'Rankings refreshed for all divisions',
            type: 'success'
        },
        ...(divisions.length > 0 ? [{
            title: 'Draft Available',
            description: `${divisions.length} divisions ready for drafting`,
            type: 'warning'
        }] : [])
    ];

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">📈 Recent Activity</h2>
                <p className={styles.subtitle}>
                    Latest updates and changes
                </p>
            </div>

            <div className={styles.activityList}>
                {activities.map((activity, index) => (
                    <div
                        key={index}
                        className={`${styles.activityItem} ${styles[activity.type]}`}
                    >
                        <div className={styles.activityTitle}>
                            {activity.title}
                        </div>
                        <div className={styles.activityDescription}>
                            {activity.description}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
