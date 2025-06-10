

// /admin/components/sections/quick-actions-section.tsx
import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../components/admin-icons';
import { ActionCard } from '../components/action-card';
import styles from './quick-actions-section.module.css';

interface QuickActionsSectionProps {
    cacheData: any;
}

export const QuickActionsSection = ({ cacheData }: QuickActionsSectionProps) => {
    const fetcher = useFetcher();

    const executeAction = (actionType: string) => {
        fetcher.submit({ actionType }, { method: 'post' });
    };

    const getRecommendedAction = () => {
        if (!cacheData) return null;
        if (cacheData.missing?.elements || cacheData.missing?.teams) return 'populateBootstrapData';
        if (cacheData.missing?.elementSummaries) return 'populateElementSummaries';
        if (cacheData.missing?.draftData) return 'generateEnhancedDataFast';
        return 'generateGameWeekPoints';
    };

    const recommendedAction = getRecommendedAction();

    return (
        <div className={styles.quickActionsContainer}>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Quick Actions</h2>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.actionGrid}>
                        <ActionCard
                            title="1. Populate Bootstrap Data"
                            description="Fetch FPL teams, events, and basic player data"
                            icon={<Icons.DatabaseIcon />}
                            buttonText="Populate Bootstrap"
                            actionType="populateBootstrapData"
                            onExecute={executeAction}
                            fetcher={fetcher}
                            recommended={recommendedAction === 'populateBootstrapData'}
                        />
                        <ActionCard
                            title="2. Populate Weekly Stats"
                            description="Fetch statistics for all players + weeks"
                            icon={<Icons.ChartIcon />}
                            buttonText="Populate Stats"
                            actionType="populateElementSummaries"
                            onExecute={executeAction}
                            fetcher={fetcher}
                            recommended={recommendedAction === 'populateElementSummaries'}
                        />
                        <ActionCard
                            title="3. Generate Draft Data"
                            description="Add draft calculations and enhanced data"
                            icon={<Icons.TargetIcon />}
                            buttonText="Generate Draft Data"
                            actionType="generateEnhancedDataFast"
                            onExecute={executeAction}
                            fetcher={fetcher}
                            recommended={recommendedAction === 'generateEnhancedDataFast'}
                        />
                        <ActionCard
                            title="4. Update Gameweek Points"
                            description="Smart update - only generates changed gameweeks"
                            icon={<Icons.TrendingUpIcon />}
                            buttonText="Update Points"
                            actionType="generateGameWeekPoints"
                            onExecute={executeAction}
                            fetcher={fetcher}
                            recommended={recommendedAction === 'generateGameWeekPoints'}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
