/* Location: app/_shared/lib/fpl/api-cache.test.ts */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fplBootstrap } from '../../test/fixtures/season-fixtures';
import { setNow } from '../clock';
import { fplApiCache } from './api-cache';
import type { EventData } from './fpl-types';
import { getGameweekData } from './gameweeks';

/**
 * `getCurrentGameweekData()` is the single answer four loaders build their whole page
 * around, and it had no test at all when it silently changed meaning in PR #118.
 *
 * The events it reads are STORED: `populateEvents` runs `getGameweekData()` once and
 * writes the flags to Firestore, so `isCurrent` on them is frozen at whenever an admin
 * last populated bootstrap data. These tests set up exactly that -- flags frozen at one
 * date, read at another -- because that gap is where the bug lived.
 */

const events = fplBootstrap().events as EventData[];

/** Events as Firestore holds them: flags computed once, at `populatedAt`. */
const storedAt = (populatedAt: string) => getGameweekData(events, new Date(populatedAt));

afterEach(() => {
    setNow(null);
    vi.restoreAllMocks();
});

describe('getCurrentGameweekData', () => {
    it('returns the gameweek being played, not the one being picked', async () => {
        // Populated after GW1's deadline, so the stored flags say GW2 is current -- the
        // window for picking a GW2 team. GW1's matches are the ones actually being played.
        const stored = storedAt('2024-08-16T18:00:00Z');
        expect(stored.find((gameweek) => gameweek.isCurrent)?.fplEvent.id).toBe(2);
        vi.spyOn(fplApiCache, 'getFplEvents').mockResolvedValue(stored);
        setNow('2024-08-17T14:00:00Z');

        const current = await fplApiCache.getCurrentGameweekData();

        expect(current?.fplEvent.id).toBe(1);
    });

    it('follows the clock even though the stored flags were frozen months earlier', async () => {
        // No admin has repopulated since August; the answer must still be January's.
        vi.spyOn(fplApiCache, 'getFplEvents').mockResolvedValue(storedAt('2024-08-16T18:00:00Z'));
        setNow('2025-01-10T00:00:00Z');

        const current = await fplApiCache.getCurrentGameweekData();

        expect(current?.fplEvent.id).toBe(20);
    });

    it('has no answer when the calendar has not been loaded', async () => {
        vi.spyOn(fplApiCache, 'getFplEvents').mockResolvedValue([]);
        setNow('2025-01-10T00:00:00Z');

        expect(await fplApiCache.getCurrentGameweekData()).toBeUndefined();
    });
});

/**
 * The other half of the pair. The cup asks a different question from the points pages:
 * which round are managers picking a team for right now? That is the deadline window, so
 * it stays one ahead of the matches being played -- and it is what `/cup/submit` has to
 * open on, or it lands managers on a round they can no longer enter.
 */
describe('getSelectionGameweekData', () => {
    it('returns the gameweek being picked, one ahead of the one being played', async () => {
        const stored = storedAt('2024-08-16T18:00:00Z');
        vi.spyOn(fplApiCache, 'getFplEvents').mockResolvedValue(stored);
        setNow('2024-08-17T14:00:00Z');

        const selection = await fplApiCache.getSelectionGameweekData();

        expect(selection?.fplEvent.id).toBe(2);
        expect((await fplApiCache.getCurrentGameweekData())?.fplEvent.id).toBe(1);
    });

    it('falls back to FPL’s own flag when no window is marked, as a finished season has none', async () => {
        const stored = storedAt('2024-08-16T18:00:00Z').map((gameweek) => ({ ...gameweek, isCurrent: false }));
        stored[37].fplEvent.is_current = true;
        vi.spyOn(fplApiCache, 'getFplEvents').mockResolvedValue(stored);

        expect((await fplApiCache.getSelectionGameweekData())?.fplEvent.id).toBe(38);
    });
});
