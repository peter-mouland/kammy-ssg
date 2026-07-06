/* Location: app/cup/lib/cup-deadlines.test.ts */

import { describe, expect, it } from 'vitest';
import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import { isAggregateRevealed, isDeadlinePassed, isSubmissionOpen, isTeamRevealed } from './cup-deadlines';

function makeGameweek(startIso: string, endIso: string): GameWeekData {
    return {
        fplEvent: { deadline_time: endIso, finished: false, id: 24, is_current: true, is_next: false, name: 'GW24' },
        gameWeekIndex: 23,
        start: new Date(startIso),
        end: new Date(endIso),
        isCurrent: true,
        isNext: false,
        hasPassed: false,
    };
}

const GW = makeGameweek('2026-01-24T11:00:00Z', '2026-01-31T13:30:00Z');

describe('deadline + submission window', () => {
    it('locks once the deadline has passed', () => {
        expect(isDeadlinePassed(GW, new Date('2026-01-31T13:29:00Z'))).toBe(false);
        expect(isDeadlinePassed(GW, new Date('2026-01-31T13:30:00Z'))).toBe(true);
        expect(isDeadlinePassed(GW, new Date('2026-02-01T00:00:00Z'))).toBe(true);
    });

    it('is open only between the previous deadline and this one', () => {
        expect(isSubmissionOpen(GW, new Date('2026-01-24T10:59:00Z'))).toBe(false); // before window
        expect(isSubmissionOpen(GW, new Date('2026-01-28T12:00:00Z'))).toBe(true); // in window
        expect(isSubmissionOpen(GW, new Date('2026-01-31T13:30:00Z'))).toBe(false); // at deadline
    });
});

describe('reveal gating', () => {
    it('reveals a team only when the deadline has passed AND subs are confirmed', () => {
        expect(isTeamRevealed({ deadlinePassed: false, subsConfirmed: false })).toBe(false);
        expect(isTeamRevealed({ deadlinePassed: true, subsConfirmed: false })).toBe(false); // past deadline, unconfirmed
        expect(isTeamRevealed({ deadlinePassed: false, subsConfirmed: true })).toBe(false);
        expect(isTeamRevealed({ deadlinePassed: true, subsConfirmed: true })).toBe(true);
    });

    it('reveals the aggregate only when every leg is revealed', () => {
        expect(isAggregateRevealed([true, false])).toBe(false);
        expect(isAggregateRevealed([true, true])).toBe(true);
        expect(isAggregateRevealed([])).toBe(false);
    });
});
