/* Location: app/cup/components/cup-fixtures.tsx */

import type { CupFixture } from '../lib/cup-fixtures';
import styles from './cup-fixtures.module.css';

/** The real-world fixtures for a gameweek, shown on the cup and submit pages. */
export function CupFixtures({ fixtures, gameweek }: { fixtures: CupFixture[]; gameweek: number }) {
    if (fixtures.length === 0) return null;
    return (
        <section className={styles.fixtures}>
            <h2 className={styles.title}>Fixtures · GW{gameweek}</h2>
            <ul className={styles.list}>
                {fixtures.map((fixture) => (
                    <li key={`${fixture.home}-${fixture.away}`} className={styles.fixture}>
                        <span className={styles.team}>{fixture.home}</span>
                        <span className={styles.score}>
                            {fixture.started ? `${fixture.homeScore}–${fixture.awayScore}` : 'v'}
                        </span>
                        <span className={styles.team}>{fixture.away}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
