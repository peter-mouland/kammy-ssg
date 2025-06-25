// app/teams/components/stats-view-toggle.tsx
import type React from 'react';
import type { StatsViewToggleProps } from '../types/team-types';
import styles from './stats-view-toggle.module.css';

export const StatsViewToggle: React.FC<StatsViewToggleProps> = ({ viewMode, onToggle }) => {
    const handleToggle = () => {
        onToggle(viewMode === 'gameweek' ? 'season' : 'gameweek');
    };

    return (
        <div className={styles.toggleContainer}>
            <button
                onClick={handleToggle}
                className={styles.toggleButton}
                title={`Switch to ${viewMode === 'gameweek' ? 'season' : 'gameweek'} view`}
            >
                <span className={styles.toggleIcon}>{viewMode === 'gameweek' ? '📅' : '📊'}</span>
                <span className={styles.toggleLabel}>{viewMode === 'gameweek' ? 'Gameweek' : 'Season'}</span>
                <span className={styles.switchIcon}>⇄</span>
            </button>
        </div>
    );
};
