/* Location: app/transfers/lib/review-deadline.test.ts */

import { describe, expect, it } from 'vitest';
import { describeReviewDeadline, formatRemaining, formatUkDeadline } from './review-deadline';

/**
 * What the review step says about the deadline: which gameweek an approved transfer starts
 * scoring in, how long is left, and what happens once the deadline has gone.
 */

const GW21_DEADLINE = '2025-01-14T18:00:00Z';
const GW21 = { gameweek: 21, deadline: GW21_DEADLINE };
const GW22 = { gameweek: 22, deadline: '2025-01-18T11:00:00Z' };

describe('the deadline as a manager reads it', () => {
    it('is UK time in winter, when UK time is UTC', () => {
        expect(formatUkDeadline(GW21_DEADLINE)).toBe('Tue 14/01/2025 18:00');
    });

    it('is UK time in summer, an hour ahead of UTC', () => {
        expect(formatUkDeadline('2024-08-16T17:30:00Z')).toBe('Fri 16/08/2024 18:30');
    });
});

describe('before the deadline', () => {
    it('says the transfer starts scoring in the gameweek the deadline closes', () => {
        const deadline = describeReviewDeadline(
            { submission: GW21, previous: { gameweek: 20, deadline: '2025-01-04T11:00:00Z' } },
            new Date('2025-01-10T12:00:00Z'),
        );

        expect(deadline).toMatchObject({ state: 'open', gameweek: 21, deadlineLabel: 'Tue 14/01/2025 18:00' });
        expect(deadline.state === 'open' && deadline.isClosingSoon).toBe(false);
    });

    it('is closing soon in the last five minutes, with the time left', () => {
        const deadline = describeReviewDeadline(
            { submission: GW21, previous: { gameweek: 20, deadline: '2025-01-04T11:00:00Z' } },
            new Date('2025-01-14T17:55:28Z'),
        );

        expect(deadline).toMatchObject({ state: 'open', isClosingSoon: true });
        expect(deadline.state === 'open' && formatRemaining(deadline.remainingMs)).toBe('4m 32s left');
    });

    it('is not closing soon with a second over five minutes to go', () => {
        const deadline = describeReviewDeadline(
            { submission: GW21, previous: { gameweek: 20, deadline: '2025-01-04T11:00:00Z' } },
            new Date('2025-01-14T17:54:59Z'),
        );

        expect(deadline.state === 'open' && deadline.isClosingSoon).toBe(false);
    });
});

describe('once the deadline has passed', () => {
    it('says so, for the gameweek the review was opened for', () => {
        const deadline = describeReviewDeadline(
            { submission: GW21, previous: { gameweek: 20, deadline: '2025-01-04T11:00:00Z' } },
            new Date('2025-01-14T18:00:00Z'),
        );

        expect(deadline).toEqual({ state: 'passed', gameweek: 21, deadlineLabel: 'Tue 14/01/2025 18:00' });
    });

    it('says so for five minutes, even when the review is reached after the deadline', () => {
        const deadline = describeReviewDeadline({ submission: GW22, previous: GW21 }, new Date('2025-01-14T18:02:00Z'));

        expect(deadline).toEqual({ state: 'passed', gameweek: 21, deadlineLabel: 'Tue 14/01/2025 18:00' });
    });

    it('still says so at exactly five minutes past', () => {
        const deadline = describeReviewDeadline({ submission: GW22, previous: GW21 }, new Date('2025-01-14T18:05:00Z'));

        expect(deadline).toMatchObject({ state: 'passed', gameweek: 21 });
    });

    it('moves on to the next deadline after five minutes', () => {
        const deadline = describeReviewDeadline({ submission: GW22, previous: GW21 }, new Date('2025-01-14T18:05:01Z'));

        expect(deadline).toMatchObject({ state: 'open', gameweek: 22, deadlineLabel: 'Sat 18/01/2025 11:00' });
    });

    it('has nothing to look back on before the first deadline of the season', () => {
        const deadline = describeReviewDeadline(
            { submission: { gameweek: 1, deadline: '2024-08-16T17:30:00Z' } },
            new Date('2024-08-10T12:00:00Z'),
        );

        expect(deadline).toMatchObject({ state: 'open', gameweek: 1 });
    });
});

describe('time left', () => {
    it('drops the minutes under a minute', () => {
        expect(formatRemaining(9_400)).toBe('9s left');
    });
});
