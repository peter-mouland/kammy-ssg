/* Location: app/_shared/lib/gameweek-availability.test.ts */

import { describe, expect, it } from 'vitest';
import { fplBootstrap } from '../test/fixtures/season-fixtures';
import type { EventData } from './fpl/fpl-types';
import { getGameweekData } from './fpl/gameweeks';
import { describeGameweekAvailability } from './gameweek-availability';

/**
 * Three different situations produce "no current gameweek", and telling them apart is the
 * whole point: an unpopulated database is not an ended season. Saying "the season has
 * ended" to someone whose Firestore is simply empty sends them looking in the wrong place.
 *
 * Built on the real 2024/25 calendar so the dates are the ones the app actually sees.
 */

const events = getGameweekData(fplBootstrap().events as EventData[], new Date('2025-01-10T00:00:00Z'));

const at = (iso: string) => describeGameweekAvailability(events, undefined, new Date(iso));

describe('when there is a current gameweek', () => {
    it('reports it as available and hands it back', () => {
        const current = events.find((gameweek) => gameweek.isCurrent);

        const result = describeGameweekAvailability(events, current);

        expect(result.available).toBe(true);
    });
});

describe('when the calendar itself is missing', () => {
    // This is the real case behind the reported crash: Firestore had 0 documents.
    it.each([[[]], [null], [undefined]])('says the data has not been loaded (events = %s)', (missing) => {
        const result = describeGameweekAvailability(missing as never, undefined);

        expect(result.available).toBe(false);
        if (result.available) return;
        expect(result.title).toMatch(/not been loaded/i);
        expect(result.isSetupProblem).toBe(true);
    });

    it('points at the admin screen rather than blaming the season', () => {
        const result = describeGameweekAvailability([], undefined);

        if (result.available) throw new Error('expected unavailable');
        expect(result.detail).toMatch(/admin/i);
        expect(result.title).not.toMatch(/season has ended/i);
    });
});

describe('when the calendar exists but no gameweek is current', () => {
    it('says the season has ended, after the final deadline', () => {
        // GW38's deadline is 2025-05-25T13:30Z.
        const result = at('2025-06-01T00:00:00Z');

        expect(result.available).toBe(false);
        if (result.available) return;
        expect(result.title).toBe('The season has ended');
        expect(result.isSetupProblem).toBe(false);
    });

    it('says the season has not started, before it begins', () => {
        const result = at('2024-07-01T00:00:00Z');

        expect(result.available).toBe(false);
        if (result.available) return;
        expect(result.title).toBe('The season has not started yet');
        expect(result.isSetupProblem).toBe(false);
    });

    it('never blames the season when the real problem is setup', () => {
        // The distinction that matters, stated as an assertion.
        const ended = at('2025-06-01T00:00:00Z');
        const empty = describeGameweekAvailability([], undefined);

        if (ended.available || empty.available) throw new Error('expected both unavailable');
        expect(ended.title).not.toBe(empty.title);
    });
});

describe('the copy itself', () => {
    it('is written for a manager, not a developer', () => {
        const results = [
            at('2025-06-01T00:00:00Z'),
            at('2024-07-01T00:00:00Z'),
            describeGameweekAvailability([], undefined),
        ];

        for (const result of results) {
            if (result.available) throw new Error('expected unavailable');
            // No stack-trace vocabulary, no property names, no error codes.
            expect(`${result.title} ${result.detail}`).not.toMatch(/undefined|fplEvent|TypeError|null/);
            expect(result.title.length).toBeLessThan(60);
            expect(result.detail.length).toBeGreaterThan(40);
        }
    });
});
