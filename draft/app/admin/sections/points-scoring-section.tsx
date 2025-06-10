
// /admin/components/sections/points-scoring-section.tsx
import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../components/admin-icons';
import { ActionCard } from '../components/action-card';
import { GameweekPointsStatus } from '../components/gameweek-points-status';
import { GameweekPointsButton } from '../components/gameweek-points-button';
import styles from './points-scoring-section.module.css';

export const PointsScoringSection = () => {
    const fetcher = useFetcher();

    const executeAction = (actionType: string) => {
        fetcher.submit({ actionType }, { method: 'post' });
    };

    return (
        <div className={styles.pointsScoringContainer}>
            {/* Gameweek Points Management */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Icons.ChartIcon />
                        Gameweek Points Management
                    </h2>
                </div>
                <div className={styles.sectionContent}>
                    <GameweekPointsStatus />

                    <div className={styles.actionGrid}>
                        <ActionCard
                            title="Smart Points Update"
                            description="Automatically detects and updates only changed gameweeks"
                            icon={<Icons.TrendingUpIcon />}
                            buttonText="Update Points"
                            actionType="generateGameWeekPoints"
                            onExecute={executeAction}
                            fetcher={fetcher}
                            recommended={true}
                        />
                        <ActionCard
                            title="Force Regenerate All"
                            description="Regenerate all points from scratch (slower)"
                            icon={<Icons.RefreshIcon />}
                            buttonText="Force Regenerate"
                            actionType="forceRegenerateAllPoints"
                            onExecute={executeAction}
                            fetcher={fetcher}
                        />
                    </div>
                </div>
            </div>

            {/* Gameweek Game Points */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Icons.TargetIcon />
                        Gameweek Game Points 👉 GSheets
                    </h2>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.warningMessage}>
                        💡 <strong>Gameweek Game Points:</strong> Generates a sheet with one column per gameweek game,
                        showing points for each player's performance in each specific game that gameweek.
                    </div>
                    <div className={styles.buttonWrapper}>
                        <GameweekPointsButton />
                    </div>
                </div>
            </div>
        </div>
    );
};
