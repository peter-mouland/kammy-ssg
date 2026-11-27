/* Location: app/transfers/lib/review-deadline.ts */

/**
 * What the review step says about the deadline.
 *
 * A transfer counts towards the gameweek whose window contains its submission time, and
 * the server stamps that time, not the form. So the review step states the deadline of the
 * gameweek it was opened for, counts down in the last few minutes, and says plainly once
 * that deadline has gone: a request sent then lands in the following week's window.
 *
 * Nothing here blocks a submission. Rules are warnings for now; the panel decides.
 */

/** How close to the deadline the countdown appears. */
export const CLOSING_SOON_MS = 5 * 60 * 1000;

export interface SubmissionGameweek {
    gameweek: number;
    /** FPL's `deadline_time`: an ISO string, or a Date once it has been through Firestore. */
    deadline: string | Date;
}

export type ReviewDeadline =
    | {
          state: 'open';
          gameweek: number;
          deadlineLabel: string;
          remainingMs: number;
          isClosingSoon: boolean;
      }
    | {
          state: 'passed';
          gameweek: number;
          deadlineLabel: string;
      };

const UK_DEADLINE_FORMAT = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

/** A deadline in UK time, as a manager reads it: "Tue 14/01/2025 18:00". */
export function formatUkDeadline(deadline: string | Date): string {
    const parts = Object.fromEntries(
        UK_DEADLINE_FORMAT.formatToParts(new Date(deadline)).map((part) => [part.type, part.value]),
    );

    return `${parts.weekday} ${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

/** Time left before the deadline: "4m 32s left", or "9s left" under a minute. */
export function formatRemaining(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return minutes > 0 ? `${minutes}m ${seconds}s left` : `${seconds}s left`;
}

export function describeReviewDeadline({ gameweek, deadline }: SubmissionGameweek, at: Date): ReviewDeadline {
    const deadlineLabel = formatUkDeadline(deadline);
    const remainingMs = new Date(deadline).getTime() - at.getTime();

    if (remainingMs <= 0) {
        return { state: 'passed', gameweek, deadlineLabel };
    }

    return {
        state: 'open',
        gameweek,
        deadlineLabel,
        remainingMs,
        isClosingSoon: remainingMs <= CLOSING_SOON_MS,
    };
}
