// app/transfers/components/review-deadline-notice.tsx

import { useEffect, useState } from 'react';
import { now } from '../../_shared/lib/clock';
import { describeReviewDeadline, formatRemaining, type SubmissionGameweek } from '../lib/review-deadline';
import styles from './review-deadline-notice.module.css';

/** How often the countdown, and the switch to "passed", catch up with the clock. */
const TICK_MS = 1000;

/**
 * The deadline on the review step: which gameweek an approved transfer starts scoring in,
 * a countdown in the last five minutes, and what happens if the deadline passes while the
 * manager is still here. It never stops them submitting.
 */
export function ReviewDeadlineNotice({ submissionGameweek }: { submissionGameweek: SubmissionGameweek }) {
    const [at, setAt] = useState(now);

    useEffect(() => {
        const timer = setInterval(() => setAt(now()), TICK_MS);
        return () => clearInterval(timer);
    }, []);

    const deadline = describeReviewDeadline(submissionGameweek, at);

    if (deadline.state === 'passed') {
        return (
            <div role="note" aria-label="Deadline" className={`${styles.notice} ${styles.passed}`}>
                Deadline for GW{deadline.gameweek}: {deadline.deadlineLabel}. Changes submitted after the deadline will
                count in the following week's transfer window.
            </div>
        );
    }

    return (
        <div role="note" aria-label="Deadline" className={styles.notice}>
            Deadline:{' '}
            <strong className={deadline.isClosingSoon ? styles.closingSoon : styles.deadline}>
                {deadline.deadlineLabel}
            </strong>{' '}
            (UK time). If approved, transfers submitted before this deadline start scoring in{' '}
            <strong className={styles.deadline}>GW{deadline.gameweek}</strong>.
            {deadline.isClosingSoon ? (
                <>
                    <span className={styles.countdown}>{formatRemaining(deadline.remainingMs)}</span>
                    <small className={styles.smallPrint}>
                        Timer runs from your device clock, so may differ from the true deadline countdown.
                    </small>
                </>
            ) : null}
        </div>
    );
}
