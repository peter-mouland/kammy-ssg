/* Location: app/_shared/lib/clock.test.ts */

import { afterEach, describe, expect, it } from 'vitest';
import { fakeNowIso, isFakeNow, now, nowMs, setNow } from './clock';
import { runWithNow } from './clock.server';

/**
 * The clock is what makes the site's date-dependent behaviour testable at all, so the
 * thing worth proving is the precedence order rather than that a getter returns a value.
 * Production sets none of the overrides and must be left on the real date.
 */

afterEach(() => {
    setNow(null);
    // Empty rather than deleted: the clock treats it as falsy either way, and `delete` on
    // process.env is a lint error here.
    process.env.KAMMY_FAKE_NOW = '';
});

describe('with nothing set, as in production', () => {
    it('returns the real date', () => {
        const before = Date.now();
        const reading = nowMs();

        expect(reading).toBeGreaterThanOrEqual(before);
        expect(reading).toBeLessThanOrEqual(Date.now());
    });

    it('reports that the clock is not being faked', () => {
        expect(isFakeNow()).toBe(false);
        expect(fakeNowIso()).toBeNull();
    });
});

describe('setNow, for a process that is one scenario', () => {
    it('freezes the clock', () => {
        setNow('2025-01-20T00:00:00.000Z');

        expect(now().toISOString()).toBe('2025-01-20T00:00:00.000Z');
        expect(isFakeNow()).toBe(true);
    });

    it('accepts a Date as well as a string', () => {
        setNow(new Date('2024-08-16T12:00:00.000Z'));

        expect(fakeNowIso()).toBe('2024-08-16T12:00:00.000Z');
    });

    it('returns to real time when cleared', () => {
        setNow('2025-01-20T00:00:00.000Z');
        setNow(null);

        expect(isFakeNow()).toBe(false);
    });

    it('rejects an unparseable date rather than silently becoming Invalid Date', () => {
        // Otherwise every downstream comparison quietly returns false and the page renders
        // an empty state that looks like missing data.
        expect(() => setNow('not-a-date')).toThrow(/unparseable/);
    });
});

describe('the KAMMY_FAKE_NOW environment variable, for a whole harness process', () => {
    it('sets the clock', () => {
        process.env.KAMMY_FAKE_NOW = '2025-05-26T00:00:00.000Z';

        expect(now().toISOString()).toBe('2025-05-26T00:00:00.000Z');
    });

    it('loses to setNow', () => {
        process.env.KAMMY_FAKE_NOW = '2025-05-26T00:00:00.000Z';
        setNow('2025-01-20T00:00:00.000Z');

        expect(now().toISOString()).toBe('2025-01-20T00:00:00.000Z');
    });
});

describe('runWithNow, for a server answering several dates at once', () => {
    it('applies inside the scope only', () => {
        setNow('2025-01-20T00:00:00.000Z');

        const inside = runWithNow('2024-08-01T00:00:00.000Z', () => now().toISOString());

        expect(inside).toBe('2024-08-01T00:00:00.000Z');
        expect(now().toISOString()).toBe('2025-01-20T00:00:00.000Z');
    });

    it('survives awaits, so a loader deep in the call stack still sees it', async () => {
        const readAfterAwait = async () => {
            await Promise.resolve();
            await new Promise((resolve) => setTimeout(resolve, 1));
            return now().toISOString();
        };

        const result = await runWithNow('2024-08-16T12:00:00.000Z', readAfterAwait);

        expect(result).toBe('2024-08-16T12:00:00.000Z');
    });

    it('keeps concurrent scopes independent, which is the whole point', async () => {
        // Two Playwright workers hitting one fixture server at two dates.
        const read = async (label: string) => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            return `${label}:${now().toISOString()}`;
        };

        const [preseason, seasonEnd] = await Promise.all([
            runWithNow('2024-08-01T00:00:00.000Z', () => read('preseason')),
            runWithNow('2025-05-26T00:00:00.000Z', () => read('season-end')),
        ]);

        expect(preseason).toBe('preseason:2024-08-01T00:00:00.000Z');
        expect(seasonEnd).toBe('season-end:2025-05-26T00:00:00.000Z');
    });

    it('rejects an unparseable date', () => {
        expect(() => runWithNow('nope', () => now())).toThrow(/unparseable/);
    });
});
