/* Location: app/transfers/components/category-standing-header.tsx */

import type { CategoryStanding } from '../../leagues';
import styles from './category-standing-header.module.css';

interface CategoryStandingHeaderProps {
    label: string;
    standing?: CategoryStanding;
}

/** "3rd", "=3rd", "21st", "112th". */
export function formatRank(rank: number, isTied: boolean): string {
    const lastTwo = rank % 100;
    const last = rank % 10;
    const suffix =
        lastTwo >= 11 && lastTwo <= 13 ? 'th' : last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th';
    return `${isTied ? '=' : ''}${rank}${suffix}`;
}

/**
 * "10 behind 2nd · 25 clear of 4th". The top manager has no "behind" and the bottom one
 * no "clear of". Sharing a place gives "Level on points".
 */
export function formatGaps(standing: CategoryStanding): string {
    if (standing.isTied) {
        return 'Level on points';
    }
    const parts: string[] = [];
    if (standing.gapAbove !== null) {
        parts.push(`${standing.gapAbove} behind ${formatRank(standing.rank - 1, false)}`);
    }
    if (standing.gapBelow !== null) {
        parts.push(`${standing.gapBelow} clear of ${formatRank(standing.rank + 1, false)}`);
    }
    return parts.join(' · ');
}

/**
 * The heading over one category of the manager's squad: where they sit in the league
 * table for it, and how far they are from the managers either side.
 */
export function CategoryStandingHeader({ label, standing }: CategoryStandingHeaderProps) {
    return (
        <div className={styles.categoryStandingHeader}>
            <h3 className={styles.categoryLabel}>{label}</h3>
            {standing ? (
                <>
                    <p className={styles.standingSummary}>
                        <span className={styles.rank}>{formatRank(standing.rank, standing.isTied)}</span>
                        <span className={styles.figure}>{standing.points} pts</span>
                    </p>
                    <p className={styles.gaps}>{formatGaps(standing)}</p>
                </>
            ) : null}
        </div>
    );
}
