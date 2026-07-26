import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Executable architecture rules.
 *
 * The rules in .kiro/steering/architecture.md are the ones we most want contributors
 * and AI assistants to follow, and the ones most easily broken by accident. A rule
 * written only in markdown degrades silently -- this file makes the important ones
 * fail loudly instead.
 *
 * Each rule carries an ALLOWLIST of the violations that already existed when the rule
 * was introduced. The allowlist is the Phase 2 worklist in .kiro/backlog.md: as those
 * items land, entries come out of these lists and can never come back. Nothing may be
 * ADDED to an allowlist without a decision recorded in the backlog.
 */

const appDir = resolve(dirname(fileURLToPath(import.meta.url)));

/** Every top-level folder under app/ is a domain. `_shared` is the horizontal one. */
const SHARED = '_shared';

const domains = readdirSync(appDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

type Import = {
    /** e.g. 'transfers/components/transfer-form.tsx' */
    from: string;
    /** e.g. 'teams/types/team-types' */
    to: string;
    fromDomain: string;
    toDomain: string;
    /** The folder directly inside the target domain, e.g. 'types', 'lib', 'server' */
    toSegment: string;
};

const sourceFiles = readdirSync(appDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));

/** Every relative import in the app, resolved to which domain it crosses into. */
const crossDomainImports: Import[] = sourceFiles.flatMap((absolutePath) => {
    const fromPath = relative(appDir, absolutePath);
    const fromDomain = fromPath.split(sep)[0];
    if (!domains.includes(fromDomain)) return [];

    const source = readFileSync(absolutePath, 'utf8');
    const specifiers = Array.from(source.matchAll(/(?:from|import)\s*\(?\s*'(\.[^']+)'/g), (m) => m[1]);

    return specifiers.flatMap((specifier) => {
        const toPath = relative(appDir, resolve(dirname(absolutePath), specifier));
        if (toPath.startsWith('..')) return [];

        const [toDomain, toSegment = ''] = toPath.split(sep);
        if (!domains.includes(toDomain) || toDomain === fromDomain) return [];

        return [{ from: fromPath, to: toPath, fromDomain, toDomain, toSegment }];
    });
});

/** Stable, paste-ready identity for an allowlist entry. */
const edge = ({ from, to }: Import) => `${from} -> ${to}`;

/** Formats failures so the fix -- or the allowlist entry -- can be copied straight out. */
const report = (violations: Import[], guidance: string) =>
    ['', `${violations.length} violation(s):`, ...violations.map((v) => `  ${edge(v)}`), '', guidance, ''].join('\n');

// ---------------------------------------------------------------------------
// Rule 1 — _shared may not depend on a domain
// ---------------------------------------------------------------------------

// From .kiro/steering/ai-contribution-rules.md: "Only move code to _shared/ if it is
// genuinely used by two or more separate domains and contains no domain-specific
// business logic. [...] Team roster logic does not [belong there]."
//
// Today _shared depends on six domains. That is backwards: shared infrastructure knows
// the vocabulary of every feature. Phase 2 fixes it by naming a shared kernel (P2.1)
// and moving each sheets module into the domain that owns it (P2.3, P2.4).
const SHARED_MAY_IMPORT: ReadonlySet<string> = new Set([
    '_shared/lib/fpl/api-cache.ts -> scoring/types/scoring-types',
    '_shared/lib/fpl/fpl-firestore.ts -> scoring/lib',
    '_shared/lib/fpl/fpl-firestore.ts -> scoring/types/scoring-types',
    '_shared/lib/sheets/draft-order.ts -> draft/types/draft-types',
    '_shared/lib/sheets/draft.ts -> draft/lib/draft-pick-calculator',
    '_shared/lib/sheets/draft.ts -> draft/types/draft-types',
    '_shared/lib/sheets/player-gw-points.ts -> scoring/lib',
    '_shared/lib/sheets/player-gw-points.ts -> scoring/types/scoring-types',
    '_shared/lib/sheets/transfers.ts -> scoring/types/scoring-types',
    '_shared/lib/sheets/transfers.ts -> transfers/types/transfer-types',
]);

describe('_shared must not depend on a domain', () => {
    const sharedImports = crossDomainImports.filter((i) => i.fromDomain === SHARED);

    it('has no new dependency from _shared into a feature domain', () => {
        const unexpected = sharedImports.filter((i) => !SHARED_MAY_IMPORT.has(edge(i)));

        expect(
            unexpected,
            report(
                unexpected,
                'Code in _shared/ must work for every domain without knowing any of them.\n' +
                    'Either move this file into the domain that owns the concept, or -- if the type\n' +
                    'is genuinely league-wide vocabulary such as DivisionId -- move the TYPE into\n' +
                    '_shared/types/ and import it from there. See P2.1-P2.4 in .kiro/backlog.md.',
            ),
        ).toEqual([]);
    });

    // The allowlist is a debt register, not a config file. If an entry no longer matches
    // anything, the debt is paid and the line must go, or the rule quietly weakens.
    it('has no stale entries left in its allowlist', () => {
        const live = new Set(sharedImports.map(edge));
        const stale = Array.from(SHARED_MAY_IMPORT).filter((entry) => !live.has(entry));

        expect(
            stale,
            `\nThese allowlist entries no longer match any import -- delete them from SHARED_MAY_IMPORT:\n${stale
                .map((s) => `  ${s}`)
                .join('\n')}\n`,
        ).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// Rule 2 — a domain may only reach another domain's types/ and lib/
// ---------------------------------------------------------------------------

// From .kiro/steering/ai-contribution-rules.md: "Types defined there can be imported by
// other domains, but the definition stays with the owning domain." Types and pure lib
// helpers are a domain's public surface. Its components and server code are not: reaching
// into them couples page structure and data loading across domain boundaries.
//
// Most entries below resolve by promoting a genuinely shared component (P2.5) -- note how
// often players/components/player and teams/components/gameweek-selector appear.
const PUBLIC_SEGMENTS = ['types', 'lib'];

const MAY_REACH_INSIDE: ReadonlySet<string> = new Set([
    'admin/components/sections/transfers-section.tsx -> players/components/player',
    'admin/components/sections/transfers-section.tsx -> teams/components/gameweek-selector',
    'admin/components/sections/transfers-section.tsx -> transfers/components/loan-status-display',
    'admin/libs/background-jobs.server.ts -> scoring/server/services/division-teams-points-population.service',
    'admin/libs/background-jobs.server.ts -> scoring/server/services/division-teams.service',
    'admin/server/actions/team-commit-actions.ts -> scoring/server/services/division-teams.service',
    'admin/server/services/system-status.service.ts -> scoring/server/services/division-teams.service',
    'admin/server/services/system-status.service.ts -> scoring/server/services/gameweek-points.service',
    'admin/server/services/system-status.service.ts -> transfers/server/services/transfers-data.service',
    'admin/server/transfers-admin.server.tsx -> transfers/server/services/transfers-data.service',
    'cup/server/actions/submit-cup-team.action.ts -> scoring/server/services/division-teams.service',
    'cup/server/cup.server.ts -> scoring/server/services/division-teams.service',
    'draft/server/draft.server.ts -> admin/server/actions/team-commit-actions',
    'homepage/homepage.route.tsx -> leagues/server/league-standings.server',
    'homepage/home.page.tsx -> leagues/components/position-points-table',
    'leagues/league-standings.tsx -> teams/components/gameweek-selector',
    'leagues/server/league-standings.server.ts -> scoring/server/services/division-teams.service',
    'players/components/player-stats-table.tsx -> scoring/components/points-breakdown-tooltip',
    'players/components/player-stats-table.tsx -> wishlist/components/wishlist-button',
    'players/components/player-stats-table.tsx -> wishlist/components/wishlist-tags',
    'players/players.page.tsx -> scoring/components/scoring-info',
    'players/players.page.tsx -> teams/components/gameweek-selector',
    'teams/components/all-teams-table.tsx -> players/components/player',
    'teams/components/position-slot-card.tsx -> players/components/player',
    'teams/server/team.server.tsx -> leagues/server/team-of-the-week.server',
    'teams/server/team.server.tsx -> scoring/server/services/division-teams.service',
    'transfers/components/current-transfers.tsx -> players/components/player',
    'transfers/components/loan-status-display.tsx -> players/components/player',
    'transfers/components/transfer-form.tsx -> players/components/player',
    'transfers/components/transfer-selector-stat-columns.tsx -> players/components/player',
    'transfers/components/transfer-selector-stat-columns.tsx -> scoring/components/points-breakdown-tooltip',
    'transfers/server/services/transfers-data.service.ts -> scoring/server/services/division-teams.service',
    'transfers/transfers.page.tsx -> teams/components/gameweek-selector',
    'wishlist/components/wishlist-details.tsx -> players/components/player',
]);

describe('a domain may only use another domain’s types and lib', () => {
    const reachesInside = crossDomainImports.filter(
        (i) => i.fromDomain !== SHARED && i.toDomain !== SHARED && !PUBLIC_SEGMENTS.includes(i.toSegment),
    );

    it('has no new import into another domain’s internals', () => {
        const unexpected = reachesInside.filter((i) => !MAY_REACH_INSIDE.has(edge(i)));

        expect(
            unexpected,
            report(
                unexpected,
                `A domain's ${PUBLIC_SEGMENTS.join('/ and ')}/ are its public surface. Everything else is internal.\n` +
                    'If a component is genuinely needed by several domains, promote it to\n' +
                    '_shared/components/ (P2.5). If it is server logic, the caller probably wants a\n' +
                    "function exported from the owning domain's lib/ instead.",
            ),
        ).toEqual([]);
    });

    it('has no stale entries left in its allowlist', () => {
        const live = new Set(reachesInside.map(edge));
        const stale = Array.from(MAY_REACH_INSIDE).filter((entry) => !live.has(entry));

        expect(
            stale,
            `\nThese allowlist entries no longer match any import -- delete them from MAY_REACH_INSIDE:\n${stale
                .map((s) => `  ${s}`)
                .join('\n')}\n`,
        ).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// Rule 3 — the domain dependency graph must not grow new cycles
// ---------------------------------------------------------------------------

// Cycles are what make a codebase impossible to reason about in pieces: you cannot
// understand, test or move scoring without also holding players, teams and transfers in
// your head. Most of the current ones dissolve once Rule 1 and Rule 2 are satisfied,
// so this is measured as a count that may only go down (P2.6).
const KNOWN_CYCLIC_PAIRS = 12;

describe('the domain dependency graph', () => {
    const graph = new Map<string, Set<string>>();
    for (const { fromDomain, toDomain } of crossDomainImports) {
        if (!graph.has(fromDomain)) graph.set(fromDomain, new Set());
        graph.get(fromDomain)?.add(toDomain);
    }

    const mutualPairs = Array.from(graph.entries())
        .flatMap(([from, tos]) => Array.from(tos).map((to) => [from, to] as const))
        .filter(([from, to]) => from < to && graph.get(to)?.has(from))
        .map(([from, to]) => `${from} <-> ${to}`)
        .sort();

    it('grows no new circular dependencies between domains', () => {
        expect(
            mutualPairs.length,
            `\nDomain pairs that depend on each other:\n${mutualPairs.map((p) => `  ${p}`).join('\n')}\n\n` +
                `Expected at most ${KNOWN_CYCLIC_PAIRS}. A new cycle means two domains can no longer be\n` +
                'understood or moved independently. If you have REMOVED one, lower KNOWN_CYCLIC_PAIRS\n' +
                'to lock the win in.\n',
        ).toBeLessThanOrEqual(KNOWN_CYCLIC_PAIRS);
    });

    it('locks in every cycle that has been removed', () => {
        expect(
            mutualPairs.length,
            `\nOnly ${mutualPairs.length} cyclic pairs remain but KNOWN_CYCLIC_PAIRS is ${KNOWN_CYCLIC_PAIRS}.\n` +
                'Lower it to that number so the cycle cannot come back.\n',
        ).toBe(KNOWN_CYCLIC_PAIRS);
    });
});

// ---------------------------------------------------------------------------
// Rule 4 — no exported type name is declared twice
// ---------------------------------------------------------------------------

// Two files exporting the same type name is how you end up assigning a
// TransferValidationResult to a TransferValidationResult and being told they are
// incompatible.
//
// This list is empty as of P1.3b and should stay that way. If you are about to add a
// name here, the fix is almost always to rename one of the two -- they are different
// concepts, or they would not both need to exist.
const DUPLICATE_TYPE_NAMES: ReadonlySet<string> = new Set([]);

describe('exported type names', () => {
    const declarations = new Map<string, string[]>();
    for (const absolutePath of sourceFiles) {
        const source = readFileSync(absolutePath, 'utf8');
        for (const match of source.matchAll(/^export\s+(?:interface|type)\s+([A-Za-z0-9_]+)/gm)) {
            const name = match[1];
            declarations.set(name, [...(declarations.get(name) ?? []), relative(appDir, absolutePath)]);
        }
    }

    it('are each declared in exactly one file', () => {
        const duplicates = Array.from(declarations.entries())
            .filter(([name, files]) => files.length > 1 && !DUPLICATE_TYPE_NAMES.has(name))
            .map(([name, files]) => `${name}: ${files.join(', ')}`);

        expect(
            duplicates,
            `\nThese type names are declared in more than one file:\n${duplicates.map((d) => `  ${d}`).join('\n')}\n\n` +
                'Give one of them a distinct name, or import the existing one. Two types with the\n' +
                'same name are indistinguishable in an error message.\n',
        ).toEqual([]);
    });

    it('has no stale entries in the known-duplicates list', () => {
        const stale = Array.from(DUPLICATE_TYPE_NAMES).filter((name) => (declarations.get(name)?.length ?? 0) < 2);

        expect(
            stale,
            `\nThese names are no longer duplicated -- remove them from DUPLICATE_TYPE_NAMES:\n${stale
                .map((s) => `  ${s}`)
                .join('\n')}\n`,
        ).toEqual([]);
    });
});
