// app/transfers/components/review-deadline-notice.tsx

import { useEffect, useState } from 'react';
import { now } from '../../_shared/lib/clock';
import { describeReviewDeadline, formatRemaining, type SubmissionGameweek } from '../lib/review-deadline';
import styles from './review-deadline-notice.module.css';

/** How often the countdown, and the switch to "passed", catch up with the clock. */
const TICK_MS = 1000;

/**
 * The deadline on the review step: which gameweek an approved transfer starts scoring in,
 * a countdown in the last five minutes, and what happens once the deadline has passed,
 * whether the manager was here when it did or arrived in the five minutes after. It never
 * stops them submitting.
 */
export function ReviewDeadlineNotice({
    submissionGameweek,
    previousGameweek,
    isDrawRequest = false,
}: {
    submissionGameweek: SubmissionGameweek;
    previousGameweek?: SubmissionGameweek;
    /** A new-player request goes into a draw after the deadline; it does not start scoring then. */
    isDrawRequest?: boolean;
}) {
    const [at, setAt] = useState(now);

    useEffect(() => {
        const timer = setInterval(() => setAt(now()), TICK_MS);
        return () => clearInterval(timer);
    }, []);

    const deadline = describeReviewDeadline({ submission: submissionGameweek, previous: previousGameweek }, at);

    if (deadline.state === 'passed') {
        return (
            <div role="note" aria-label="Deadline" className={`${styles.notice} ${styles.passed}`}>
                <span className={styles.line}>
                    Deadline for GW{deadline.gameweek}: <strong>{deadline.deadlineLabel}</strong>
                </span>
                <span className={styles.line}>
                    Changes submitted after the deadline will count in the following week's transfer window.
                </span>
            </div>
        );
    }

    return (
        <div role="note" aria-label="Deadline" className={styles.notice}>
            <span className={styles.line}>
                Deadline:{' '}
                <strong className={deadline.isClosingSoon ? styles.closingSoon : styles.deadline}>
                    {deadline.deadlineLabel}
                </strong>{' '}
                (UK time)
            </span>
            {isDrawRequest ? (
                <span className={styles.line}>
                    Requests submitted before this deadline go into the draw made shortly after it.
                </span>
            ) : (
                <span className={styles.line}>
                    If approved, transfers submitted before this deadline start scoring in{' '}
                    <strong className={styles.deadline}>GW{deadline.gameweek}</strong>.
                </span>
            )}
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
