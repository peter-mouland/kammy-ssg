/* Location: app/transfers/lib/review-deadline.test.ts */

import { describe, expect, it } from 'vitest';
import { describeReviewDeadline, formatRemaining, formatUkDeadline } from './review-deadline';

/**
 * What the review step says about the deadline: which gameweek an approved transfer starts
 * scoring in, how long is left, and what happens once the deadline has gone.
 */

const GW21_DEADLINE = '2025-01-14T18:00:00Z';

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
            { gameweek: 21, deadline: GW21_DEADLINE },
            new Date('2025-01-10T12:00:00Z'),
        );

        expect(deadline).toMatchObject({ state: 'open', gameweek: 21, deadlineLabel: 'Tue 14/01/2025 18:00' });
        expect(deadline.state === 'open' && deadline.isClosingSoon).toBe(false);
    });

    it('is closing soon in the last five minutes, with the time left', () => {
        const deadline = describeReviewDeadline(
            { gameweek: 21, deadline: GW21_DEADLINE },
            new Date('2025-01-14T17:55:28Z'),
        );

        expect(deadline).toMatchObject({ state: 'open', isClosingSoon: true });
        expect(deadline.state === 'open' && formatRemaining(deadline.remainingMs)).toBe('4m 32s left');
    });

    it('is not closing soon with a second over five minutes to go', () => {
        const deadline = describeReviewDeadline(
            { gameweek: 21, deadline: GW21_DEADLINE },
            new Date('2025-01-14T17:54:59Z'),
        );

        expect(deadline.state === 'open' && deadline.isClosingSoon).toBe(false);
    });
});

describe('once the deadline has passed', () => {
    it('says so, for the gameweek the review was opened for', () => {
        const deadline = describeReviewDeadline(
            { gameweek: 21, deadline: GW21_DEADLINE },
            new Date('2025-01-14T18:00:00Z'),
        );

        expect(deadline).toEqual({ state: 'passed', gameweek: 21, deadlineLabel: 'Tue 14/01/2025 18:00' });
    });
});

describe('time left', () => {
    it('drops the minutes under a minute', () => {
        expect(formatRemaining(9_400)).toBe('9s left');
    });
});
