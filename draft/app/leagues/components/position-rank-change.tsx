/* Location: app/leagues/components/position-rank-change.tsx */

import styles from './position-rank-change.module.css';

interface PositionRankChangeProps {
    points: number;
    rankChange: number | null;
    isFirstGameweek?: boolean;
}

const formatRankChange = (rankChange, isFirstGameweek) => {
    if (isFirstGameweek || rankChange === null) {
        return null;
    }

    if (rankChange === 0) {
        return '-'; // Don't show anything for no change
    }

    if (rankChange > 0) {
        return `+${rankChange}`;
    }

    return rankChange.toString();
};

export function PositionRankChange({ points, rankChange, isFirstGameweek }: PositionRankChangeProps) {
    const formattedRankChange = formatRankChange(rankChange, isFirstGameweek);
    return (
        <div className={styles.positionRankChange}>
            {formattedRankChange && (
                <span
                    className={`${styles.rankChange} ${
                        !rankChange ? styles.noChange : rankChange > 0 ? styles.improvement : styles.decline
                    }`}
                >
                    {formattedRankChange}
                </span>
            )}
            <span className={styles.points}>
                {points || '-'}
            </span>
        </div>
    );
}
