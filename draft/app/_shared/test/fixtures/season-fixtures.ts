/* Location: app/_shared/test/fixtures/season-fixtures.ts */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Node-only readers over `test-fixtures/`.
 *
 * These are the only thing that knows where the fixture data lives and how it is named.
 * Everything above them -- the MSW handlers, the harness server, the loader tests -- goes
 * through here, so moving or renaming a fixture is a one-file change.
 *
 * **Nothing in `draft/app/` may import this at runtime.** The files are read through
 * `node:fs` with a computed path rather than an `import`, so Vite cannot pull them into a
 * bundle. That rule is load-bearing: a template-literal dynamic import of the old fixture
 * folder put 35MB and 1318 chunks into every deploy. See `test-fixtures/README.md`.
 *
 * On the season seam: the FPL half is 2024/25 and the league half is 2025/26. Gameweek
 * *numbers* line up, dates do not, and the four defensive stats are invented for every
 * player. Assert behaviour and shape, never a specific points total.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

/** `draft/app/_shared/test/fixtures` -> the repo root's `test-fixtures/`. */
export const FIXTURES_ROOT = resolve(HERE, '../../../../../test-fixtures');

export type SheetCell = string | number | boolean;

/** Exactly what the Sheets API returns, which is how the files were captured. */
export interface SheetValuesResponse {
    range: string;
    majorDimension: string;
    values: SheetCell[][];
}

interface ElementSummary {
    fixtures: unknown[];
    history: Record<string, unknown>[];
}

interface FplBootstrap {
    events: unknown[];
    teams: unknown[];
    elements: Record<string, unknown>[];
    [key: string]: unknown;
}

/**
 * Tab name -> fixture filename.
 *
 * The tabs use four different naming styles (`UserTeams`, `premierLeague-transfers`,
 * `FPL Team Codes`, `FPL_Player_export`) and the files are all lower-kebab-case. This must
 * stay byte-identical to the slug in `test-fixtures/README.md` and in
 * `scripts/fetch-season-fixtures.mjs`, because the files were renamed with it -- a
 * slightly different slug resolves to nothing at all.
 */
export function fixtureSlug(tab: string): string {
    return tab
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // camelCase boundary: leagueOne -> league-One
        .replace(/[^a-zA-Z0-9]+/g, '-') // spaces, underscores, slashes
        .replace(/^-|-$/g, '')
        .toLowerCase();
}

function readJson<T>(path: string): T {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
}

/**
 * A tab's rows, header row included.
 *
 * Throws rather than returning `[]` when the file is missing. An empty sheet and an absent
 * file are indistinguishable downstream, and the app treats an empty tab as a legitimate
 * state -- so a typo'd tab name would surface as "the cup has no entries" rather than as
 * an error. The message carries the slug it looked for, because that is the part that is
 * usually wrong.
 */
export function sheetTab(tab: string): SheetCell[][] {
    const slug = fixtureSlug(tab);
    const path = join(FIXTURES_ROOT, 'spreadsheets', `${slug}.json`);

    if (!existsSync(path)) {
        throw new Error(
            `[season-fixtures] no fixture for sheet tab "${tab}" (looked for spreadsheets/${slug}.json). ` +
                'Either the tab name is wrong, or the fixture was never captured -- see test-fixtures/README.md.',
        );
    }

    return readJson<SheetValuesResponse>(path).values ?? [];
}

/** Every tab that has a fixture file, by slug. Used to assert the set has not drifted. */
export function sheetTabSlugs(): string[] {
    return readdirSync(join(FIXTURES_ROOT, 'spreadsheets'))
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.replace(/\.json$/, ''))
        .sort();
}

let bootstrapCache: FplBootstrap | undefined;

/**
 * The merged element pool: the real 2024/25 bootstrap plus 54 synthesized elements.
 *
 * The merge is a concatenation, not a computation -- synthetic ids start at 805, above
 * 2024/25's maximum of 804, so there is nothing to reconcile. It is required because
 * `fpl-firestore.ts:198` filters elements to codes present in the `Players` sheet; without
 * the 54, those roster slots cannot resolve at all.
 */
export function fplBootstrap(): FplBootstrap {
    if (!bootstrapCache) {
        const base = readJson<FplBootstrap>(join(FIXTURES_ROOT, 'fpl', 'bootstrap-static.json'));
        const synthetic = readJson<{ elements: Record<string, unknown>[] }>(
            join(FIXTURES_ROOT, 'fpl', 'synthetic-elements.json'),
        );

        bootstrapCache = { ...base, elements: [...base.elements, ...synthetic.elements] };
    }

    return bootstrapCache;
}

let fixturesCache: unknown[] | undefined;

/** The real 2024/25 fixture list, 380 matches. */
export function fplFixtures(): unknown[] {
    fixturesCache ??= readJson<unknown[]>(join(FIXTURES_ROOT, 'fpl', 'fixtures.json'));
    return fixturesCache;
}

const summaryCache = new Map<number, ElementSummary>();

/**
 * One player's season: per-gameweek history and remaining fixtures.
 *
 * `players.json` and `element-summary/` are 1:1 at 458 each -- the never-rostered players
 * with no stats were pruned -- so a miss here means a broken fixture rather than a routine
 * gap. It still returns empty rather than throwing, because that is what the app already
 * tolerates (`player.server.ts:88` catches a missing file and renders an empty page), but
 * it says so loudly.
 */
export function elementSummary(id: number): ElementSummary {
    const cached = summaryCache.get(id);
    if (cached) return cached;

    const path = join(FIXTURES_ROOT, 'fpl', 'element-summary', `${id}.json`);
    if (!existsSync(path)) {
        console.error(
            `[season-fixtures] no element-summary fixture for player id ${id}. ` +
                'The pool is meant to be 1:1 with players.json, so this is a broken fixture, not a gap.',
        );
        return { fixtures: [], history: [] };
    }

    const summary = readJson<ElementSummary>(path);
    summaryCache.set(id, summary);
    return summary;
}

/** Every player id with an element-summary fixture. */
export function elementSummaryIds(): number[] {
    return readdirSync(join(FIXTURES_ROOT, 'fpl', 'element-summary'))
        .filter((name) => name.endsWith('.json'))
        .map((name) => Number(name.replace(/\.json$/, '')))
        .sort((a, b) => a - b);
}

const liveCache = new Map<number, { elements: { id: number; stats: Record<string, unknown> }[] }>();

/**
 * FPL's `event/{gw}/live/` payload, derived rather than captured.
 *
 * There is no live-data capture and there cannot be one -- the endpoint only ever serves
 * the current gameweek, and 2024/25 is over. But a live element is `{ id, stats }` where
 * `stats` is the same per-gameweek stat line the element-summary history already holds, so
 * the round-N row of every summary *is* the live payload for gameweek N. Two loaders
 * depend on it (`leagues/server/team-of-the-week.server.ts:26`,
 * `players/server/players.server.ts:60`), and serving them an empty list would show every
 * player on zero -- indistinguishable from a scoring bug.
 *
 * The first call for a gameweek reads all 458 summaries, so it is slow once and cached
 * after. Only players who actually featured in that round appear, which is what FPL does.
 */
export function gameweekLive(gameweek: number): { elements: { id: number; stats: Record<string, unknown> }[] } {
    const cached = liveCache.get(gameweek);
    if (cached) return cached;

    const elements = elementSummaryIds().flatMap((id) => {
        const round = elementSummary(id).history.find((row) => row.round === gameweek);
        return round ? [{ id, stats: round }] : [];
    });

    const live = { elements };
    liveCache.set(gameweek, live);
    return live;
}

/** Drop every memoised fixture. For tests that care about read cost, not correctness. */
export function clearFixtureCaches(): void {
    bootstrapCache = undefined;
    fixturesCache = undefined;
    summaryCache.clear();
    liveCache.clear();
}
