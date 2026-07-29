import { execFileSync } from 'node:child_process';
import { beforeEach, describe, expect, it } from 'vitest';
import { CACHE_INVALIDATION_RULES, CACHE_KEYS, getCacheTTL, getInvalidationKeys } from './cache-config';
import { dataCache } from './data-cache.service';

// These tests describe cache invalidation from the caller's point of view: an admin
// performs an action, and afterwards some cached data must be gone and the rest must
// still be there. They deliberately assert only on which keys survive — never on how
// the matching is implemented — so they hold through any refactor of DataCacheService.

const TTL = 60_000;

// A realistic spread of live keys, one per shape the app actually caches.
const LIVE_KEYS = [
    CACHE_KEYS.FPL.BOOTSTRAP,
    CACHE_KEYS.FPL.PLAYERS,
    CACHE_KEYS.FPL.TEAMS,
    CACHE_KEYS.FPL.EVENTS,
    CACHE_KEYS.FPL.FIXTURES,
    CACHE_KEYS.FPL.PLAYER_STATS('123'),
    CACHE_KEYS.FPL.PLAYER_STATS('456'),
    CACHE_KEYS.FPL.GAMEWEEK_LIVE(5),
    CACHE_KEYS.FPL.CACHE_HEALTH,
    CACHE_KEYS.FPL.TEAMS_BY_CODE,
    CACHE_KEYS.SHEETS.DIVISIONS,
    CACHE_KEYS.SHEETS.USER_TEAMS,
    CACHE_KEYS.SHEETS.PLAYERS,
    CACHE_KEYS.SHEETS.DRAFT,
    CACHE_KEYS.SHEETS.DRAFT_STATE,
    CACHE_KEYS.SHEETS.DRAFT_ORDERS,
    CACHE_KEYS.SHEETS.DRAFT_STATE_BY_DIVISION('leagueOne'),
    CACHE_KEYS.SHEETS.DRAFT_STATE_BY_DIVISION('championship'),
    CACHE_KEYS.SHEETS.TRANSFERS('leagueOne'),
    CACHE_KEYS.SHEETS.TRANSFERS('championship'),
    CACHE_KEYS.SHEETS.CUP,
    CACHE_KEYS.SHEETS.CUP_CONFIG,
    CACHE_KEYS.DRAFT_SYNC.COMPARISON('leagueOne'),
    CACHE_KEYS.DRAFT_SYNC.COMPARISON('championship'),
    CACHE_KEYS.DRAFT_SYNC.ALL_COMPARISONS,
    CACHE_KEYS.FIREBASE.DRAFT_STATE('leagueOne'),
    CACHE_KEYS.FIREBASE.DRAFT_STATE('championship'),
    CACHE_KEYS.FIREBASE.DRAFT_PICKS('leagueOne'),
];

/** Fill the cache with every live key, so each test can assert what survived. */
const populateCache = () => {
    dataCache.clear();
    for (const key of LIVE_KEYS) {
        dataCache.set(key, 'cached-value', TTL);
    }
};

beforeEach(() => {
    populateCache();
});

describe('FPL_DATA_UPDATED', () => {
    // The rule lists 'fpl:player-stats:' as a prefix covering every per-player cache.
    // Player stats have a 24h TTL, so if the prefix is not honoured a nightly FPL
    // refresh leaves yesterday's stats being served for a further day.
    it('clears every per-player stats cache, not just the exact keys', () => {
        dataCache.invalidateMultiple(getInvalidationKeys('FPL_DATA_UPDATED'));

        expect(dataCache.has(CACHE_KEYS.FPL.PLAYER_STATS('123'))).toBe(false);
        expect(dataCache.has(CACHE_KEYS.FPL.PLAYER_STATS('456'))).toBe(false);
    });

    it('clears the top-level FPL caches', () => {
        dataCache.invalidateMultiple(getInvalidationKeys('FPL_DATA_UPDATED'));

        expect(dataCache.has(CACHE_KEYS.FPL.BOOTSTRAP)).toBe(false);
        expect(dataCache.has(CACHE_KEYS.FPL.PLAYERS)).toBe(false);
        expect(dataCache.has(CACHE_KEYS.FPL.TEAMS)).toBe(false);
        expect(dataCache.has(CACHE_KEYS.FPL.EVENTS)).toBe(false);
        expect(dataCache.has(CACHE_KEYS.FPL.FIXTURES)).toBe(false);
    });

    // Counter-case: FPL is a separate data source from Sheets. Refreshing one must
    // not throw away the other, or every admin refresh re-reads the whole spreadsheet.
    it('leaves Google Sheets caches untouched', () => {
        dataCache.invalidateMultiple(getInvalidationKeys('FPL_DATA_UPDATED'));

        expect(dataCache.has(CACHE_KEYS.SHEETS.DIVISIONS)).toBe(true);
        expect(dataCache.has(CACHE_KEYS.SHEETS.USER_TEAMS)).toBe(true);
        expect(dataCache.has(CACHE_KEYS.SHEETS.TRANSFERS('leagueOne'))).toBe(true);
        expect(dataCache.has(CACHE_KEYS.SHEETS.CUP)).toBe(true);
    });
});

describe('DRAFT_ACTION', () => {
    it('clears the acting division’s draft state', () => {
        dataCache.invalidateMultiple(getInvalidationKeys('DRAFT_ACTION', 'leagueOne'));

        expect(dataCache.has(CACHE_KEYS.SHEETS.DRAFT_STATE_BY_DIVISION('leagueOne'))).toBe(false);
        expect(dataCache.has(CACHE_KEYS.SHEETS.DRAFT)).toBe(false);
        expect(dataCache.has(CACHE_KEYS.DRAFT_SYNC.COMPARISON('leagueOne'))).toBe(false);
    });

    // The draft is division-scoped: a pick in one division must not invalidate another
    // division's cached state, or every pick invalidates all three drafts.
    it('leaves another division’s division-scoped state alone', () => {
        dataCache.invalidateMultiple(getInvalidationKeys('DRAFT_ACTION', 'leagueOne'));

        expect(dataCache.has(CACHE_KEYS.SHEETS.DRAFT_STATE_BY_DIVISION('championship'))).toBe(true);
        expect(dataCache.has(CACHE_KEYS.DRAFT_SYNC.COMPARISON('championship'))).toBe(true);
    });

    it('leaves unrelated data sources alone', () => {
        dataCache.invalidateMultiple(getInvalidationKeys('DRAFT_ACTION', 'leagueOne'));

        expect(dataCache.has(CACHE_KEYS.FPL.BOOTSTRAP)).toBe(true);
        expect(dataCache.has(CACHE_KEYS.SHEETS.CUP)).toBe(true);
        expect(dataCache.has(CACHE_KEYS.SHEETS.TRANSFERS('leagueOne'))).toBe(true);
    });
});

describe('TRANSFERS_UPDATED', () => {
    it('clears only the affected division’s transfers', () => {
        dataCache.invalidateMultiple(getInvalidationKeys('TRANSFERS_UPDATED', 'leagueOne'));

        expect(dataCache.has(CACHE_KEYS.SHEETS.TRANSFERS('leagueOne'))).toBe(false);
        expect(dataCache.has(CACHE_KEYS.SHEETS.TRANSFERS('championship'))).toBe(true);
    });
});

describe('CUP_CONFIG_CHANGED', () => {
    // Submissions are interpreted against the stage->gameweek map, so changing the
    // config must also drop the submissions read through it.
    it('clears both the cup config and the cup submissions', () => {
        dataCache.invalidateMultiple(getInvalidationKeys('CUP_CONFIG_CHANGED'));

        expect(dataCache.has(CACHE_KEYS.SHEETS.CUP_CONFIG)).toBe(false);
        expect(dataCache.has(CACHE_KEYS.SHEETS.CUP)).toBe(false);
    });
});

describe('invalidatePattern', () => {
    it('clears every key beneath a wildcard prefix', () => {
        dataCache.invalidatePattern('fpl:player-stats:*');

        expect(dataCache.has(CACHE_KEYS.FPL.PLAYER_STATS('123'))).toBe(false);
        expect(dataCache.has(CACHE_KEYS.FPL.PLAYER_STATS('456'))).toBe(false);
        expect(dataCache.has(CACHE_KEYS.FPL.BOOTSTRAP)).toBe(true);
    });

    it('treats a trailing colon as a prefix too', () => {
        dataCache.invalidatePattern('fpl:');

        expect(dataCache.has(CACHE_KEYS.FPL.BOOTSTRAP)).toBe(false);
        expect(dataCache.has(CACHE_KEYS.FPL.PLAYER_STATS('123'))).toBe(false);
        expect(dataCache.has(CACHE_KEYS.SHEETS.DIVISIONS)).toBe(true);
    });

    // Counter-case: a pattern is anchored at the start of the key. Matching anywhere
    // in the key would make 'transfers:' silently clear 'sheets:transfers:leagueOne'
    // and mask call sites that are using the wrong prefix.
    it('anchors the pattern at the start of the key', () => {
        dataCache.invalidatePattern('transfers:');

        expect(dataCache.has(CACHE_KEYS.SHEETS.TRANSFERS('leagueOne'))).toBe(true);
    });

    it('reports how many entries it cleared', () => {
        expect(dataCache.invalidatePattern('fpl:player-stats:*')).toBe(2);
        expect(dataCache.invalidatePattern('fpl:player-stats:*')).toBe(0);
    });
});

/**
 * Both structural checks below need the same scan of the app. It shells out to `grep -r`
 * over every source file, so it is by far the slowest thing in the suite -- it is done
 * ONCE and shared, rather than per test.
 *
 * These have an explicit timeout because they are I/O bound, not compute bound: under a
 * loaded machine (the suite runs test files in parallel) the default 5s was marginal and
 * made the whole suite flaky.
 */
let ruleCallSites: string[] | null = null;

const rulesCalledInApp = (): string[] => {
    if (ruleCallSites === null) {
        const source = execFileSync('grep', ['-rho', "getInvalidationKeys('[A-Z_]*'", 'app'], {
            cwd: process.cwd(),
            encoding: 'utf8',
        });
        ruleCallSites = Array.from(source.matchAll(/getInvalidationKeys\('([A-Z_]+)'/g), (m) => m[1]);
    }
    return ruleCallSites;
};

const STRUCTURAL_SCAN_TIMEOUT_MS = 30_000;

describe('the invalidation rules stay honest', () => {
    // Four rules were declared here and never called, while the real invalidation
    // happened via ad-hoc dataCache.invalidate() calls elsewhere. That left the
    // documented behaviour and the actual behaviour free to drift apart silently.
    // A rule with no caller is a lie about what the app does, so fail on it.
    it(
        'has a caller in the app for every declared rule',
        () => {
            const called = new Set(rulesCalledInApp());

            const uncalled = Object.keys(CACHE_INVALIDATION_RULES).filter((rule) => !called.has(rule));

            expect(uncalled).toEqual([]);
        },
        STRUCTURAL_SCAN_TIMEOUT_MS,
    );

    // The mirror of the above: a call site naming a rule that does not exist returns
    // an empty key list, so nothing is invalidated and nothing complains.
    it(
        'declares every rule the app asks for',
        () => {
            const undeclared = rulesCalledInApp().filter((rule) => !(rule in CACHE_INVALIDATION_RULES));

            expect(undeclared).toEqual([]);
        },
        STRUCTURAL_SCAN_TIMEOUT_MS,
    );

    it('resolves every rule to at least one key', () => {
        const empty = [
            ['FPL_DATA_UPDATED', getInvalidationKeys('FPL_DATA_UPDATED')],
            ['TRANSFERS_UPDATED', getInvalidationKeys('TRANSFERS_UPDATED', 'leagueOne')],
            ['CUP_SUBMITTED', getInvalidationKeys('CUP_SUBMITTED')],
            ['CUP_CONFIG_CHANGED', getInvalidationKeys('CUP_CONFIG_CHANGED')],
            ['CUP_BRACKET_UPDATED', getInvalidationKeys('CUP_BRACKET_UPDATED')],
            ['DRAFT_ACTION', getInvalidationKeys('DRAFT_ACTION', 'leagueOne')],
            ['DRAFT_SYNC_ACTION', getInvalidationKeys('DRAFT_SYNC_ACTION', 'leagueOne')],
            ['SHEETS_CLEAR', getInvalidationKeys('SHEETS_CLEAR', 'leagueOne')],
        ].filter(([, keys]) => keys.length === 0);

        expect(empty).toEqual([]);
    });
});

describe('getCacheTTL', () => {
    // 'sheets:cup-config' also contains 'sheets:cup', so the more specific key has to
    // win. Getting this backwards gives cup submissions a 5-minute TTL and the config
    // a 30-second one -- both wrong, and neither visible without a test.
    it('resolves the more specific cup key before the general one', () => {
        expect(getCacheTTL(CACHE_KEYS.SHEETS.CUP_CONFIG)).toBe(5 * 60 * 1000);
        expect(getCacheTTL(CACHE_KEYS.SHEETS.CUP)).toBe(30 * 1000);
    });

    it('gives division-scoped draft state the same TTL as the global key', () => {
        expect(getCacheTTL(CACHE_KEYS.SHEETS.DRAFT_STATE_BY_DIVISION('leagueOne'))).toBe(
            getCacheTTL(CACHE_KEYS.SHEETS.DRAFT_STATE),
        );
    });

    it('falls back to one minute for a key it does not recognise', () => {
        expect(getCacheTTL('something:nobody-declared')).toBe(60 * 1000);
    });

    // A new cache key whose TTL was never added to getCacheTTL silently inherits the
    // one-minute fallback, which looks like it works and quietly hammers the source.
    // Keys whose correct TTL genuinely is one minute are listed here so the check
    // stays meaningful rather than being weakened to accommodate them.
    it('recognises every live key rather than falling through', () => {
        const legitimatelyOneMinute: string[] = [CACHE_KEYS.FPL.CACHE_HEALTH];
        const fallback = getCacheTTL('something:nobody-declared');

        const unrecognised = LIVE_KEYS.filter(
            (key) => getCacheTTL(key) === fallback && !legitimatelyOneMinute.includes(key),
        );

        expect(unrecognised).toEqual([]);
    });
});
