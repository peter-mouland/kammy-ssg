// app/teams/components/team-view-tabs.tsx
import type React from 'react';
import type { TeamViewTabsProps } from '../types/team-view-types';
import styles from './team-view-tabs.module.css';

export const TeamViewTabs: React.FC<TeamViewTabsProps> = ({
    activeTab,
    onTabChange,
    playerCount,
}) => {
    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabsList} role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'my-team'}
                    onClick={() => onTabChange('my-team')}
                    className={`${styles.tab} ${activeTab === 'my-team' ? styles.active : ''}`}
                >
                    <span className={styles.tabIcon}>👤</span>
                    <span className={styles.tabLabel}>My Team</span>
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'all-teams'}
                    onClick={() => onTabChange('all-teams')}
                    className={`${styles.tab} ${activeTab === 'all-teams' ? styles.active : ''}`}
                >
                    <span className={styles.tabIcon}>👥</span>
                    <span className={styles.tabLabel}>All Teams</span>
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'totw'}
                    onClick={() => onTabChange('totw')}
                    className={`${styles.tab} ${activeTab === 'totw' ? styles.active : ''}`}
                >
                    <span className={styles.tabIcon}>🏆</span>
                    <span className={styles.tabLabel}>TOTW</span>
                </button>
            </div>

            <div className={styles.tabIndicator} data-active-tab={activeTab} />
        </div>
    );
};
