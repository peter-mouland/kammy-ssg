/* Location: draft/harness/rebuild-determinism.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { dataCache } from '../app/_shared/lib/cache/data-cache.service';
import { setNow } from '../app/_shared/lib/clock';
import { dumpInMemoryFirestore, resetInMemoryFirestore } from '../app/_shared/lib/firestore-cache/firestore-memory';
import { FixtureSheetStore, fixtureHandlers } from '../app/_shared/test/fixtures/fixture-msw-handlers';
import { rebuildSeason } from './rebuild-season';

/**
 * **The season rebuild does not depend on the clock, and the fixture server's design rests
 * on that.**
 *
 * The rebuild walks every gameweek from 0 upward regardless of the date: gameweek numbers
 * come from the loop, transfers are assigned to gameweeks by their own timestamps against
 * the calendar, and points come from each player's history row for that gameweek number.
 * Nothing consults `now()`.
 *
 * So the server can rebuild **once** at boot and then serve any `?now=` from the same
 * stored data -- the clock's job is to choose which slice a page reads, not to change what
 * is stored. If that stopped being true, every date after the first would silently get
 * data built for a different one, which is the kind of bug that looks like a scoring
 * error. Hence a test rather than a comment.
 *
 * Verified once at the full 38 gameweeks: `division-teams` is byte-identical across a GW1
 * rebuild and a season-end rebuild, all 13MB of it. This runs 3 gameweeks, which covers
 * the same code paths in about two seconds.
 */

process.env.KAMMY_FIXTURE_FIRESTORE = '1';

const THROUGH_GAMEWEEK = 3;

const store = new FixtureSheetStore();
const server = setupServer(...fixtureHandlers(store));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterAll(() => {
    server.close();
    setNow(null);
});

/**
 * Wall-clock stamps are written with the real date by design (they record when the
 * document was produced, not what it describes), so they are blanked before comparing.
 * Everything left is content.
 */
const STAMPS =
    /"(lastUpdated|createdAt|updatedAt|pointsLastUpdated|generatedAt|assignedAt|seasonGeneratedOn|lastGeneratedAt|onLoanStart|copiedAt)":"[^"]*"/g;

async function rebuildAt(iso: string): Promise<Record<string, string>> {
    resetInMemoryFirestore();
    dataCache.clear();
    setNow(iso);

    await rebuildSeason({ throughGameweek: THROUGH_GAMEWEEK });

    return Object.fromEntries(
        Object.entries(dumpInMemoryFirestore()).map(([collection, docs]) => [
            collection,
            JSON.stringify(docs).replace(STAMPS, '"$1":"X"'),
        ]),
    );
}

describe('rebuilding at different dates', () => {
    let early: Record<string, string>;
    let late: Record<string, string>;

    beforeAll(async () => {
        early = await rebuildAt('2024-08-16T12:00:00Z'); // GW1
        late = await rebuildAt('2025-05-26T00:00:00Z'); // past the final deadline
    }, 120_000);

    it('produces identical division-teams documents, whatever the date', () => {
        // The 13MB every page reads. This is the invariant the fixture server relies on.
        expect(late['division-teams']).toBe(early['division-teams']);
    });

    it('produces identical cache state', () => {
        expect(late['cache-state']).toBe(early['cache-state']);
    });

    it('differs only in the stored gameweek flags, which are recomputed on read anyway', () => {
        // `fpl-bootstrap/events` stores isCurrent/isNext/hasPassed as they were at write
        // time. Under a fake clock `getFplEvents()` re-derives them on every read, so the
        // stored values are inert -- but they are the one thing the date does change here,
        // and this test says so rather than leaving it as an unexplained mismatch.
        expect(late['fpl-bootstrap']).not.toBe(early['fpl-bootstrap']);

        const flagsOnly = (dump: string) => dump.replace(/"(isCurrent|isNext|hasPassed)":(true|false)/g, '"$1":X');
        expect(flagsOnly(late['fpl-bootstrap'])).toBe(flagsOnly(early['fpl-bootstrap']));
    });
});
