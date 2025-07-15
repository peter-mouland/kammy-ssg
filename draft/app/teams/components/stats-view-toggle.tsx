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
            <div className={styles.toggleTrack} data-active={viewMode}>
                {/* Sliding background indicator */}
                <div className={styles.toggleSlider} data-position={viewMode} />

                {/* Toggle buttons */}
                <button
                    type="button"
                    onClick={() => onToggle('gameweek')}
                    className={`${styles.toggleOption} ${viewMode === 'gameweek' ? styles.active : ''}`}
                    aria-pressed={viewMode === 'gameweek'}
                    title="View gameweek stats"
                >
                    <span className={styles.toggleIcon}>📅</span>
                    <span className={styles.toggleLabel}>Gameweek</span>
                </button>

                <button
                    type="button"
                    onClick={() => onToggle('season')}
                    className={`${styles.toggleOption} ${viewMode === 'season' ? styles.active : ''}`}
                    aria-pressed={viewMode === 'season'}
                    title="View season stats"
                >
                    <span className={styles.toggleIcon}>📊</span>
                    <span className={styles.toggleLabel}>Season</span>
                </button>
            </div>
        </div>
    );
};
