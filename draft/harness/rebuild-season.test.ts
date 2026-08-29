/* Location: draft/harness/rebuild-season.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { dataCache } from '../app/_shared/lib/cache/data-cache.service';
import { setNow } from '../app/_shared/lib/clock';
import { resetInMemoryFirestore } from '../app/_shared/lib/firestore-cache/firestore-memory';
import { FixtureSheetStore, fixtureHandlers } from '../app/_shared/test/fixtures/fixture-msw-handlers';
import { getDivisionTeamsDocument } from '../app/scoring/index.server';
import { rebuildSeason } from './rebuild-season';

/**
 * The season rebuild, end to end: draft picks in, rosters and points out, through the
 * app's real transfer integration and real `POSITION_RULES`.
 *
 * This is the most code any single test in the repo exercises, and it is the thing the
 * harness cannot work without -- every page reads `division-teams`.
 *
 * It builds the **whole** season -- 117 documents, 3 divisions x GW0-38 -- because that
 * turned out to cost 6.8s, not the minutes the plan budgeted for. Cheap enough to keep on
 * the pre-commit hook, and cheap enough that the fixture server can rebuild at boot rather
 * than caching to `.harness/`.
 *
 * **No points totals are asserted.** The four defensive stats are invented for every
 * player, so a specific total here would be asserting fiction. Shape and behaviour only.
 */

process.env.KAMMY_FIXTURE_FIRESTORE = '1';

const THROUGH_GAMEWEEK = 38;

const store = new FixtureSheetStore();
const server = setupServer(...fixtureHandlers(store));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterAll(() => {
    server.close();
    setNow(null);
});

afterEach(() => server.resetHandlers());

/** A manager's squad as a comparable string: who is in it, ignoring points and slots. */
const squadOf = (doc: Awaited<ReturnType<typeof getDivisionTeamsDocument>>, managerId: string) =>
    Object.values(doc?.teams?.[managerId]?.roster ?? {})
        .map((slot) => slot?.player?.playerCode)
        .filter(Boolean)
        .sort()
        .join(',');

describe('rebuilding the season from fixtures', () => {
    let summary: Awaited<ReturnType<typeof rebuildSeason>>;

    beforeAll(async () => {
        resetInMemoryFirestore();
        dataCache.clear();
        // Mid-season, so the gameweeks being built are in the past and finished.
        setNow('2025-01-10T00:00:00Z');

        summary = await rebuildSeason({ throughGameweek: THROUGH_GAMEWEEK });
    }, 120_000);

    it('builds every division', () => {
        expect(summary.divisions.sort()).toEqual(['championship', 'leagueOne', 'premierLeague']);
    });

    it('produces a document for every division and gameweek, with no failures', () => {
        expect(summary.failures).toEqual([]);
        // GW0 plus one per division per gameweek.
        expect(summary.documentsWritten).toBe(3 + 3 * THROUGH_GAMEWEEK);
    });

    it('seeds GW0 from the draft picks', async () => {
        const gw0 = await getDivisionTeamsDocument('leagueOne', 0);

        expect(Object.keys(gw0?.teams ?? {}).length).toBeGreaterThan(0);
    });

    it('gives every manager a full 13-slot roster', async () => {
        const doc = await getDivisionTeamsDocument('leagueOne', 1);
        const rosters = Object.values(doc?.teams ?? {});

        expect(rosters.length).toBeGreaterThan(0);
        for (const team of rosters) {
            // 13 fixed slots; on_loan_0 is optional, so 12 is the floor.
            expect(Object.keys(team.roster).length).toBeGreaterThanOrEqual(12);
        }
    });

    it('resolves every rostered player to a real name, never an empty slot', async () => {
        const doc = await getDivisionTeamsDocument('leagueOne', 1);

        for (const team of Object.values(doc?.teams ?? {})) {
            for (const slot of Object.values(team.roster)) {
                // The 54 synthesized elements exist precisely so this holds -- without
                // them, players who joined in summer 2025 resolve to nothing.
                expect(slot?.player?.playerName ?? '').not.toBe('');
            }
        }
    });

    it('carries a roster forward from one gameweek to the next', async () => {
        const [gw1, gw2] = await Promise.all([
            getDivisionTeamsDocument('leagueOne', 1),
            getDivisionTeamsDocument('leagueOne', 2),
        ]);

        expect(Object.keys(gw2?.teams ?? {})).toEqual(Object.keys(gw1?.teams ?? {}));
    });

    /**
     * The rebuild had been applying **zero** transfers, for every gameweek of every
     * division, and nothing noticed. The transfer timestamps sat a year ahead of the FPL
     * calendar, so every transfer was assigned past the final deadline and none was ever
     * due -- the rebuild just copied rosters forward 38 times.
     *
     * The test above passed *because of* that bug: "carries a roster forward" is trivially
     * true when nothing ever changes. So these assert the opposite -- that squads move --
     * which is what proves the transfer path is exercised at all.
     */
    it('applies transfers, so a manager’s squad changes during the season', async () => {
        const documents = await Promise.all(
            Array.from({ length: THROUGH_GAMEWEEK + 1 }, (_, gameweek) =>
                getDivisionTeamsDocument('premierLeague', gameweek),
            ),
        );

        const managers = Object.keys(documents[0]?.teams ?? {});
        expect(managers.length).toBeGreaterThan(0);

        let changes = 0;
        for (let gameweek = 1; gameweek < documents.length; gameweek++) {
            for (const manager of managers) {
                if (squadOf(documents[gameweek - 1], manager) !== squadOf(documents[gameweek], manager)) changes++;
            }
        }

        // A season of real transfers moves a lot of squads. The threshold is deliberately
        // well above zero and well below the real figure, so it fails loudly if transfers
        // stop applying and does not churn when the fixtures shift by a row.
        expect(changes, 'no squad ever changed — transfers are not being applied').toBeGreaterThan(20);
    });

    it('assigns transfers across the season rather than piling them at the end', async () => {
        // The failure mode was not only "no transfers" but "every transfer in the last
        // gameweek", which is what an out-of-range timestamp produces. Squad changes must be
        // spread out.
        //
        // Comparing whole team objects would be useless here -- points change every gameweek
        // regardless of transfers, so any two documents differ and the test passes on the
        // broken data. It compares squad *composition* only, which is what a transfer moves.
        const documents = await Promise.all(
            Array.from({ length: THROUGH_GAMEWEEK + 1 }, (_, gameweek) =>
                getDivisionTeamsDocument('premierLeague', gameweek),
            ),
        );

        const gameweeksWithChange = new Set<number>();
        for (let gameweek = 1; gameweek < documents.length; gameweek++) {
            const managers = Object.keys(documents[gameweek]?.teams ?? {});
            if (managers.some((manager) => squadOf(documents[gameweek - 1], manager) !== squadOf(documents[gameweek], manager))) {
                gameweeksWithChange.add(gameweek);
            }
        }

        expect(gameweeksWithChange.size, 'squad changes are not spread across the season').toBeGreaterThan(10);
    });

    it('scores each gameweek, stamping which gameweek the points are for', async () => {
        const doc = await getDivisionTeamsDocument('leagueOne', 2);

        expect(doc?.metadata.pointsLastGameweek).toBe(2);
        expect(doc?.metadata.pointsLastUpdated).not.toBeNull();
    });

    it('awards points to at least some players, so scoring actually ran', async () => {
        const doc = await getDivisionTeamsDocument('leagueOne', 1);
        const slots = Object.values(doc?.teams ?? {}).flatMap((team) => Object.values(team.roster));

        // Deliberately not a specific total: the defensive stats are invented. What is
        // being asserted is that the scoring path ran at all rather than leaving zeros.
        expect(slots.some((slot) => (slot?.gameweek?.points?.total ?? 0) !== 0)).toBe(true);
    });

    it('accumulates season totals across gameweeks', async () => {
        const doc = await getDivisionTeamsDocument('leagueOne', 2);
        const slots = Object.values(doc?.teams ?? {}).flatMap((team) => Object.values(team.roster));

        expect(slots.some((slot) => (slot?.season?.seasonUpToGameweek ?? 0) > 0)).toBe(true);
    });

    it('reaches GW38 with a scored roster, so the whole season is walkable', async () => {
        // The end state promotion/relegation markers and season standings all read from.
        const doc = await getDivisionTeamsDocument('premierLeague', 38);
        const slots = Object.values(doc?.teams ?? {}).flatMap((team) => Object.values(team.roster));

        expect(doc?.metadata.pointsLastGameweek).toBe(38);
        expect(slots.some((slot) => (slot?.season?.points?.total ?? 0) !== 0)).toBe(true);
    });

    it('keeps each division’s teams separate', async () => {
        const [leagueOne, championship] = await Promise.all([
            getDivisionTeamsDocument('leagueOne', 1),
            getDivisionTeamsDocument('championship', 1),
        ]);

        const shared = Object.keys(leagueOne?.teams ?? {}).filter((id) => id in (championship?.teams ?? {}));
        expect(shared).toEqual([]);
    });
});
