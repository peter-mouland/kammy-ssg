// app/transfers/components/new-player-draw-panel.tsx

import styles from './new-player-draw-panel.module.css';

function describeOtherRequests(count: number): string {
    if (count === 0) return 'No other manager has asked for him yet.';
    if (count === 1) return '1 other manager has asked for him.';
    return `${count} other managers have asked for him.`;
}

/**
 * What requesting a new player means (rules 3.5, 3.7, 3.8), shown on review. Draws are made
 * by hand, shortly after the deadline, so the winner's weekly allowance has already reset.
 */
export function NewPlayerDrawPanel({ otherRequests }: { otherRequests: number }) {
    return (
        <div role="note" aria-label="New player draw" className={styles.panel}>
            <strong className={styles.title}>This is a request for a draw</strong>
            <ul className={styles.points}>
                <li className={styles.point}>
                    Nothing changes until the draw. The scorers make it shortly after this gameweek's deadline.
                </li>
                <li className={styles.point}>
                    If you win, it uses one of next week's two transfers, so you don't need to save one this week.
                </li>
                <li className={styles.point}>You can win at most one draw per gameweek.</li>
                <li className={styles.point}>{describeOtherRequests(otherRequests)}</li>
            </ul>
        </div>
    );
}
