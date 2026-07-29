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

/** How an import specifier for a domain's index appears once the extension is dropped. */
const INDEX_SPECIFIERS: Record<string, string> = {
    '': 'index.ts', // "../../draft"
    index: 'index.ts', // "../../draft/index"
    'index.server': 'index.server.ts', // "../../draft/index.server"
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

        const [toDomain, rawSegment = ''] = toPath.split(sep);
        if (!domains.includes(toDomain) || toDomain === fromDomain) return [];

        // Imports omit the extension, and a bare domain import ("../../draft") resolves
        // to that domain's index. Normalise both so the public-API rule recognises them
        // instead of seeing a segment-less reach inside.
        const toSegment = INDEX_SPECIFIERS[rawSegment] ?? rawSegment;

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
// EMPTY as of P2.1b, and it should stay that way. _shared no longer imports any feature
// domain. If you are about to add an entry here, the fix is almost always that the type
// belongs in the shared kernel (_shared/types/), or that the logic belongs in the domain
// that owns it and the caller should sequence the two.
const SHARED_MAY_IMPORT: ReadonlySet<string> = new Set([]);

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
// Rule 2 — a domain may only use another domain's PUBLIC API
// ---------------------------------------------------------------------------

// A domain's public API is what it deliberately exports for others. Everything else --
// components, server code, internal helpers -- is private, because reaching into it
// couples page structure and data loading across domain boundaries.
//
// TARGET (P2.7): `<domain>/index.ts` is the only public surface. A domain decides what
// to expose; everything else is private, including types and lib.
//
// TODAY: `types/` and `lib/` are also accepted, because that is the existing convention
// and flipping to index-only in one go would turn ~60 working imports into violations.
// They are listed here as TRANSITIONAL and come out as P2.7 lands, one domain at a time.
//
// Why an index at all: three separate items have now stalled because `admin` orchestrates
// other domains -- that is its job -- and had no legal way to reach their server logic.
// Ten of the entries below are exactly that. An index gives a domain a way to say "this
// operation is for other domains to call" without exposing everything behind it. See the
// orchestrator discussion under P2.3 in .kiro/backlog.md.
// `index.server.ts` is a second, server-only entry point. It exists because a domain's
// server operations reach modules that touch Firebase/Sheets/process.env at import time,
// and re-exporting those from index.ts would make the whole public API unsafe to import
// from a component. See the decisions log in .kiro/backlog.md (2026-07-28).
const PUBLIC_API_ENTRYPOINTS = ['index.ts', 'index.tsx', 'index.server.ts'];
const TRANSITIONAL_PUBLIC_SEGMENTS = ['types', 'lib'];

const PUBLIC_SEGMENTS = [...PUBLIC_API_ENTRYPOINTS, ...TRANSITIONAL_PUBLIC_SEGMENTS];

// EMPTY as of P2.7. Every domain now has an index.ts and/or index.server.ts, and that
// is the only way in. If you are about to add an entry here, export what you need from
// the owning domain's index instead -- that is what the index is for.
const MAY_REACH_INSIDE: ReadonlySet<string> = new Set([]);

describe('a domain may only use another domain’s public API', () => {
    const reachesInside = crossDomainImports.filter(
        (i) => i.fromDomain !== SHARED && i.toDomain !== SHARED && !PUBLIC_SEGMENTS.includes(i.toSegment),
    );

    it('has no new import into another domain’s internals', () => {
        const unexpected = reachesInside.filter((i) => !MAY_REACH_INSIDE.has(edge(i)));

        expect(
            unexpected,
            report(
                unexpected,
                'A domain is reachable through its public API only:\n' +
                    `  ${PUBLIC_API_ENTRYPOINTS.join(' / ')}   (the target -- see P2.7)\n` +
                    `  ${TRANSITIONAL_PUBLIC_SEGMENTS.map((s) => `${s}/`).join(', ')}   (transitional, being phased out)\n\n` +
                    'Everything else -- components/, server/, internal helpers -- is private.\n\n' +
                    'To fix, in order of preference:\n' +
                    "  1. Export what you need from the owning domain's index.ts, and import that.\n" +
                    '  2. If it is a component several domains need, promote it to _shared/components/ (P2.5).\n' +
                    '  3. If it is genuinely shared infrastructure, it does not belong in a domain at all.',
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
const KNOWN_CYCLIC_PAIRS = 6;

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

// ---------------------------------------------------------------------------
// Rule 5: the documented route table matches the real one
// ---------------------------------------------------------------------------

// architecture.md is loaded into every AI session via CLAUDE.md, so a stale route
// table produces confidently wrong output rather than a visible error. It had drifted
// to 20 of 27 routes and was missing the cup domain entirely before this check existed.
const ARCHITECTURE_DOC = resolve(appDir, '../../.kiro/steering/architecture.md');

const routeFiles = readFileSync(resolve(appDir, 'routes.ts'), 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//')) // commented-out routes are not routes
    .flatMap((line) => Array.from(line.matchAll(/['"]([\w\-./]+\.tsx?)['"]/g), (m) => m[1]));

describe('the route table in architecture.md', () => {
    it('lists every route in routes.ts', () => {
        const doc = readFileSync(ARCHITECTURE_DOC, 'utf8');
        const undocumented = routeFiles.filter((file) => !doc.includes(file));

        expect(
            undocumented,
            `\nThese routes are missing from the route table in .kiro/steering/architecture.md:\n${undocumented
                .map((f) => `  ${f}`)
                .join('\n')}\n\n` +
                'That file is loaded into every AI session, so anything missing from it is\n' +
                'invisible to the next contributor. Add a row for each route above.\n',
        ).toEqual([]);
    });

    it('does not list routes that no longer exist', () => {
        const doc = readFileSync(ARCHITECTURE_DOC, 'utf8');
        const documented = Array.from(doc.matchAll(/`([\w\-./]+\.route\.tsx?)`/g), (m) => m[1]);
        const stale = documented.filter((file) => !routeFiles.includes(file));

        expect(
            stale,
            `\nThese routes are documented in .kiro/steering/architecture.md but are not in routes.ts:\n${stale
                .map((f) => `  ${f}`)
                .join('\n')}\n\nDelete their rows, or restore the route.\n`,
        ).toEqual([]);
    });
});
