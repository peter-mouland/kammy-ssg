/* Location: app/leagues/components/range-gameweeks.tsx */

import type { GameweekScoringWindow } from '../lib/gameweek-range';
import styles from './range-gameweeks.module.css';

/**
 * In UK time, explicitly: the page is rendered on the server and again in the browser, and
 * the deadlines are set in UK time. Left to the machine's zone, the two could disagree.
 */
const DEADLINE_FORMAT = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
});

const formatDeadline = (iso: string) => DEADLINE_FORMAT.format(new Date(iso));

/**
 * The gameweeks a range covers and when each was scored, so a manager can check a combined
 * table lines up with, say, a calendar month before settling a prize on it.
 */
export function RangeGameweeks({ windows }: { windows: GameweekScoringWindow[] }) {
    return (
        <section className={styles.rangeGameweeks} aria-labelledby="range-gameweeks-title">
            <h3 id="range-gameweeks-title" className={styles.title}>
                Gameweeks in this range
            </h3>
            <p className={styles.note}>Points count from each gameweek’s deadline until the next one.</p>
            <table className={styles.windows}>
                <thead>
                    <tr>
                        <th className={styles.headerCell}>Gameweek</th>
                        <th className={styles.headerCell}>From</th>
                        <th className={styles.headerCell}>To</th>
                    </tr>
                </thead>
                <tbody>
                    {windows.map((window) => (
                        <tr key={window.gameweek}>
                            <td className={styles.cell}>GW {window.gameweek}</td>
                            <td className={styles.cell}>{formatDeadline(window.from)}</td>
                            <td className={styles.cell}>{window.to ? formatDeadline(window.to) : 'End of season'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
