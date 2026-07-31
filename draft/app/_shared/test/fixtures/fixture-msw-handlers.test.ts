/* Location: app/_shared/test/fixtures/fixture-msw-handlers.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { dataCache } from '../../lib/cache/data-cache.service';
import { fplApi } from '../../lib/fpl/api';
import { readCupConfigRows, readCupSubmissionRows } from '../../lib/sheets/cup';
import { readDivisions } from '../../lib/sheets/divisions';
import { readAllDraftStates, readDraftPicks } from '../../lib/sheets/draft';
import { readDraftOrders } from '../../lib/sheets/draft-order';
import { readPlayers } from '../../lib/sheets/players';
import { addTransfer, readTransfers } from '../../lib/sheets/transfers';
import { readUserTeams } from '../../lib/sheets/user-teams';
import type { ProcessedTransferSheetData } from '../../types/sheets-types';
import { FixtureSheetStore, fixtureHandlers } from './fixture-msw-handlers';
import { elementSummary, elementSummaryIds, fixtureSlug, fplBootstrap, sheetTab } from './season-fixtures';

/**
 * The fixture handlers are asserted through the app's **real** readers, not by inspecting
 * the handler output. Every one of these tests runs the real `@googleapis/sheets` client
 * and the real FPL client, with only the bytes on the wire coming from `test-fixtures/`.
 *
 * That makes this two things at once. It proves the harness's data layer works, and it is
 * the first evidence that the captured fixtures are *usable* -- until now every tab was
 * `Fix ●` / `Val ○` in `.kiro/testing-progress.md`: data present, nothing asserting it
 * parses. Six of these readers had no test at all (G8).
 *
 * Row counts are asserted because a fixture silently losing rows is exactly the failure
 * this is meant to catch. Points totals are never asserted -- the four defensive stats are
 * invented for every player (see `test-fixtures/README.md`).
 */

const store = new FixtureSheetStore();
const server = setupServer(...fixtureHandlers(store));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
    server.resetHandlers();
    // Every sheet read is cached, or the second test sees the first test's rows.
    dataCache.clear();
    store.reset();
});

afterAll(() => server.close());

describe('resolving a sheet tab to its fixture file', () => {
    // The four naming styles the real tabs use. The files were renamed with this exact
    // slug, so a change here silently resolves to nothing.
    it.each([
        ['UserTeams', 'user-teams'],
        ['premierLeague-transfers', 'premier-league-transfers'],
        ['FPL Team Codes', 'fpl-team-codes'],
        ['FPL_Player_export', 'fpl-player-export'],
        ['player-gw-points', 'player-gw-points'],
        // Only a lower-to-upper boundary splits, so a run of capitals stays together.
        // Nothing relies on this; it is pinned because the slug must not drift.
        ['NotATab', 'not-atab'],
    ])('slugs %s to %s', (tab, expected) => {
        expect(fixtureSlug(tab)).toBe(expected);
    });

    it('throws for an unknown tab rather than returning an empty sheet', () => {
        // An empty tab is a legitimate state in this app, so a silent [] would surface as
        // "the cup has no entries" rather than as a broken fixture. The message carries
        // the slug because that is the half that is usually wrong.
        expect(() => sheetTab('NotATab')).toThrow(/NotATab.*not-atab\.json/s);
    });
});

describe('the sheet tabs the app reads, through their real readers', () => {
    it('reads the three divisions', async () => {
        const divisions = await readDivisions();

        expect(divisions).toHaveLength(3);
        expect(divisions.map((d) => d.id).sort()).toEqual(['championship', 'leagueOne', 'premierLeague']);
    });

    it('reads all 24 managers, each assigned to a division', async () => {
        const managers = await readUserTeams();

        expect(managers).toHaveLength(24);
        expect(managers.every((m) => Boolean(m.divisionId))).toBe(true);
    });

    it('reads all 288 draft picks, every one carrying the code the roster joins on', async () => {
        const picks = await readDraftPicks();

        expect(picks).toHaveLength(288);
        // Picks join to FPL by `playerCode`, never by `playerId` -- that is what makes a
        // 2024/25 element pool usable against 2025/26 sheets.
        expect(picks.every((pick) => Number(pick.playerCode) > 0)).toBe(true);
    });

    it('reads a draft state for each division', async () => {
        const states = await readAllDraftStates();

        expect(states).toHaveLength(3);
        expect(states.map((state) => state.divisionId).sort()).toEqual(['championship', 'leagueOne', 'premierLeague']);
    });

    it('reads the draft order, grouped by division', async () => {
        const orders = await readDraftOrders();

        expect(Object.keys(orders).sort()).toEqual(['championship', 'leagueOne', 'premierLeague']);
        expect(Object.values(orders).flat()).toHaveLength(24);
    });

    it('reads the player sheet, 1:1 with the element-summary pool', async () => {
        const players = await readPlayers();

        expect(players).toHaveLength(458);
        expect(players).toHaveLength(elementSummaryIds().length);
    });

    it('reads every division’s transfers', async () => {
        expect(await readTransfers('leagueOne')).toHaveLength(147);
        expect(await readTransfers('championship')).toHaveLength(214);
        expect(await readTransfers('premierLeague')).toHaveLength(483);
    });

    it('reads the cup config that decides which gameweeks a stage covers', async () => {
        const config = await readCupConfigRows();

        expect(config.length).toBeGreaterThan(0);
        expect(config.some((row) => row.key.includes('league'))).toBe(true);
    });

    it('reads the cup submissions, which are known to be near-empty', async () => {
        // Documented gap G1: one submission, so every cup page renders its empty state.
        // Asserted so that authoring real rows shows up here as a deliberate change.
        expect(await readCupSubmissionRows()).toHaveLength(1);
    });
});

describe('the FPL endpoints, through the real FPL client', () => {
    it('serves the merged element pool: 804 real plus 54 synthesized', async () => {
        const bootstrap = await fplApi.getFplBootstrapData();

        expect(bootstrap.elements).toHaveLength(858);
        expect(bootstrap.teams).toHaveLength(20);
        expect(bootstrap.events).toHaveLength(38);
    });

    it('places every synthesized element above the real pool, so ids never collide', async () => {
        const bootstrap = await fplApi.getFplBootstrapData();
        const ids = bootstrap.elements.map((element) => element.id);

        expect(Math.max(...ids)).toBe(858);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('serves the 380-match fixture list', async () => {
        expect(await fplApi.getFplFixtureData()).toHaveLength(380);
    });

    it('serves a player’s per-gameweek history', async () => {
        const summary = await fplApi.getPlayerDetailedStats(1);

        expect(summary.history).toHaveLength(38);
        expect(summary.history[0].round).toBe(1);
    });

    it('derives live gameweek data from the element summaries', async () => {
        // There is no live capture and there cannot be one -- FPL serves only the current
        // gameweek. The round-N row of each summary is the live payload for gameweek N.
        const live = await fplApi.getGameweekLiveData(21);

        expect(live.elements.length).toBeGreaterThan(0);
        expect(live.elements.every((element) => element.stats.round === 21)).toBe(true);

        const first = live.elements[0];
        expect(elementSummary(first.id).history.find((row) => row.round === 21)).toEqual(first.stats);
    });

    it('reports a player with no summary as empty rather than breaking the page', async () => {
        const summary = await fplApi.getPlayerDetailedStats(999999);

        expect(summary.history).toEqual([]);
    });
});

describe('writing to a sheet', () => {
    const transfer: ProcessedTransferSheetData = {
        status: '',
        timestamp: new Date('2025-01-20T12:00:00.000Z'),
        manager: 'harness-manager',
        transferOut: 'Salah',
        codeOut: 118748,
        transferIn: 'Saka',
        codeIn: 223340,
        transferType: 'Transfer',
        comment: 'written by the harness',
        loanTo: '',
        loanFrom: '',
    };

    it('makes an appended row visible to the next read', async () => {
        // The whole point of a mutable store. Without it a submitted transfer vanishes on
        // reload, and Playwright can only ever test that a form renders.
        const before = await readTransfers('leagueOne');
        await addTransfer('leagueOne', transfer);
        dataCache.clear();
        const after = await readTransfers('leagueOne');

        expect(after).toHaveLength(before.length + 1);
        expect(after.at(-1)?.manager).toBe('harness-manager');
    });

    it('appends a pending transfer, which is the state an admin then approves', async () => {
        await addTransfer('leagueOne', transfer);
        dataCache.clear();

        expect((await readTransfers('leagueOne')).at(-1)?.status).toBe('');
    });

    it('does not leak a write into another division', async () => {
        await addTransfer('leagueOne', transfer);
        dataCache.clear();

        expect(await readTransfers('championship')).toHaveLength(214);
    });

    it('is returned to the captured rows by reset, so scenarios stay independent', async () => {
        await addTransfer('leagueOne', transfer);
        store.reset();
        dataCache.clear();

        expect(await readTransfers('leagueOne')).toHaveLength(147);
    });

    it('never writes to the fixture files on disk', async () => {
        await addTransfer('leagueOne', transfer);

        // sheetTab() reads the file fresh; the store holds the mutation in memory only.
        expect(sheetTab('leagueOne-transfers')).toHaveLength(148);
    });
});

describe('the merged bootstrap', () => {
    it('is memoised, so the 2MB parse happens once', () => {
        expect(fplBootstrap()).toBe(fplBootstrap());
    });
});
