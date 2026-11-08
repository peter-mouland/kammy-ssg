/* Location: app/transfers/components/fixture-strip.tsx */

import type { UpcomingFixture, UpcomingGameweek } from '../lib/upcoming-fixtures';
import styles from './fixture-strip.module.css';

const DIFFICULTY_CLASS: Record<number, string | undefined> = {
    1: styles.difficulty1,
    2: styles.difficulty2,
    3: styles.difficulty3,
    4: styles.difficulty4,
    5: styles.difficulty5,
};

interface FixtureStripProps {
    gameweeks: UpcomingGameweek[] | undefined;
}

/**
 * The opponent, with the venue in the case: "ARS" at home, "ars" away. FPL's own fixture
 * convention, and it keeps three chips narrow enough to fit a phone.
 */
export function formatFixture(fixture: UpcomingFixture): string {
    return fixture.isHome ? fixture.opponent.toUpperCase() : fixture.opponent.toLowerCase();
}

/** The same match spelled out, for the tooltip: "GW21: ARS at home, difficulty 4". */
function describeFixture(gameweek: number, fixture: UpcomingFixture): string {
    return `GW${gameweek}: ${fixture.opponent.toUpperCase()} ${fixture.isHome ? 'at home' : 'away'}, difficulty ${fixture.difficulty}`;
}

/**
 * A club's next few gameweeks, one slot per gameweek, each match coloured by FPL's
 * difficulty rating. A double gameweek stacks two matches; a blank shows a muted dash.
 */
export function FixtureStrip({ gameweeks }: FixtureStripProps) {
    if (!gameweeks?.length) {
        return <span className={styles.unknown}>–</span>;
    }

    return (
        <div className={styles.fixtureStrip}>
            {gameweeks.map(({ gameweek, fixtures }) => (
                <div key={gameweek} className={styles.gameweek}>
                    {fixtures.length === 0 ? (
                        <span className={`${styles.fixture} ${styles.blank}`} title={`No game in GW${gameweek}`}>
                            –
                        </span>
                    ) : (
                        fixtures.map((fixture) => (
                            <span
                                key={`${fixture.opponent}-${fixture.isHome}`}
                                className={`${styles.fixture} ${DIFFICULTY_CLASS[fixture.difficulty] ?? ''}`}
                                title={describeFixture(gameweek, fixture)}
                            >
                                {formatFixture(fixture)}
                            </span>
                        ))
                    )}
                </div>
            ))}
        </div>
    );
}
