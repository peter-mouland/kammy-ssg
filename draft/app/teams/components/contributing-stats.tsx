// app/teams/components/contributing-stats.tsx
import type React from 'react';
import type { ContributingStatsProps } from '../types/team-types';
import styles from './contributing-stats.module.css';

export const ContributingStats: React.FC<ContributingStatsProps> = ({
    statsBreakdown,
    viewMode,
    isExpanded,
    onToggleExpanded,
}) => {
    // Filter to show only relevant stats or all stats when expanded
    const statsToShow = isExpanded
        ? Object.entries(statsBreakdown)
        : Object.entries(statsBreakdown).filter(([_, stat]) => stat.isRelevant && stat.statValue > 0);

    // Format points display
    const formatPoints = (points: number) => {
        return points < 0 ? `-${points}` : points.toString();
    };

    // Get stat icon
    const getStatIcon = (statKey: string) => {
        const icons: Record<string, string> = {
            appearance: '👤',
            goals: '⚽',
            assists: '🅰️',
            cleanSheets: '🛡️',
            yellowCards: '🟨',
            redCards: '🟥',
            saves: '🥅',
            penaltiesSaved: '🚫',
            goalsConceded: '😞',
            bonus: '⭐',
        };
        return icons[statKey] || '📊';
    };

    return (
        <div className={styles.contributingStats}>
            <div className={styles.header}>
                <h4 className={styles.title}>
                    Contributing Stats
                    <span className={styles.viewMode}>({viewMode})</span>
                </h4>
                <button
                    onClick={onToggleExpanded}
                    className={styles.expandButton}
                    title={isExpanded ? 'Show fewer stats' : 'Show all stats'}
                >
                    {isExpanded ? '▲' : '▼'}
                </button>
            </div>

            <div className={styles.statsGrid}>
                {statsToShow.map(([statKey, stat]) => (
                    <div key={statKey} className={`${styles.statItem} ${stat.isRelevant ? '' : styles.notRelevant}`}>
                        <div className={styles.statIcon}>{getStatIcon(statKey)}</div>

                        <div className={styles.statContent}>
                            <div className={styles.statLabel}>{stat.label}</div>
                            <div className={styles.statValues}>
                                <span className={styles.statValue}>{stat.statValue}</span>
                                <span className={styles.pointsValue}>{formatPoints(stat.pointsValue)}</span>
                            </div>
                            {stat.description && <div className={styles.statDescription}>{stat.description}</div>}
                        </div>
                    </div>
                ))}

                {statsToShow.length === 0 && (
                    <div className={styles.noStats}>
                        No contributing stats for this {viewMode === 'gameweek' ? 'gameweek' : 'season'}
                    </div>
                )}
            </div>

            {!isExpanded && Object.values(statsBreakdown).some((stat) => !stat.isRelevant || stat.statValue === 0) && (
                <div className={styles.expandHint}>Click ▼ to see all stats including non-contributing ones</div>
            )}
        </div>
    );
};
