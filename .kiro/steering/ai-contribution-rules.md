---
inclusion: always
---

# AI Contribution Rules

These rules apply to all contributors — human and AI alike. They exist to keep the codebase coherent as non-engineers start contributing with AI assistance.

---

## Philosophy

This project follows three guiding principles:

**1. Consumer-focused testing (Kent C. Dodds / Testing Trophy)**
Tests should resemble how a real user interacts with the software. Prefer integration-style tests that exercise real behaviour through real boundaries. Avoid testing implementation details.

**2. Test at the boundaries (Google SRE)**
The most valuable place to test is where your code meets the outside world: route loaders, scoring calculation functions, transfer validation logic, cache invalidation. Not internal helper functions, not React component internals.

**3. Domain-driven structure**
Code is organised vertically by domain (teams, scoring, transfers, draft, players, leagues) with shared horizontal concerns in `_shared/`. New code belongs in the domain it affects. Cross-cutting utilities belong in `_shared/`.

---

## Testing Rules

### Bugs must be fixed with a test

Before fixing a bug, write a test that reproduces it. The fix is only complete when that test passes. This prevents regressions and documents what went wrong.

Tests must never be written to make a known bug pass. A test that asserts broken behaviour is just hiding the bug with extra ceremony. If you identify a bug, the test should fail until the bug is fixed. If the current behaviour is intentional — even if surprising — the test name and comments should describe the *intended design*, not frame it as a bug.

### New features must be tested from the consumer's perspective

Test what the feature does, not how it does it. For a server loader, test what data it returns for a given input. For a scoring function, test what points it produces for a given stat line. For a transfer validation, test which transfers are accepted and rejected.

### No mocks — use real implementations

Do not mock modules, functions, or data layers in tests unless it is physically impossible to avoid (e.g. a third-party HTTP call). Instead:
- Use real scoring logic with real inputs
- Use real validation functions with real transfer data
- Use real loader logic with in-memory or fixture data substituted at the boundary (e.g. inject a fake Sheets client that returns fixture data, rather than mocking `fetch` or individual functions)

The goal is that a passing test means the real behaviour works, not just that the wiring is correct.

### What to test

| Domain | What to test |
|---|---|
| `scoring/` | That given a stat line and a position, the correct points are calculated. Test edge cases in `POSITION_RULES` (e.g. saves threshold, goals conceded penalty). |
| `transfers/` | That valid transfers are accepted and invalid ones are rejected. Test all `TransferType` variants. |
| `draft/` | That snake draft order is generated correctly. That the same player cannot be picked twice in the same division. |
| Route loaders | That the loader returns the correct shape of data for a given URL and division. |
| `_shared/lib/` | Only the cache invalidation logic and TTL config — these have real business impact. |

### Where tests live

Tests are co-located with the source file they test, using the `.test.ts` or `.test.tsx` suffix:

```
draft/app/scoring/lib/calculations.ts
draft/app/scoring/lib/calculations.test.ts   ← sits right next to the source

draft/app/transfers/lib/validators/ownership-validator.ts
draft/app/transfers/lib/validators/ownership-validator.test.ts
```

Do not use `__tests__/` subfolders — that is a Jest convention and is not used here.

### Structuring test data

If a function under test requires several inputs just to be callable, define those as a shared object outside the tests. The data that actually affects the outcome being asserted belongs inline in the individual test, so the reader can see cause and effect in one place.

```ts
// shared setup — everything the function needs to not crash
const requiredContext = {
  divisionRosters: makeDivisionRosters(),
  gameweekData: makeGameweek(),
  allGameweekTransfers: [],
};

// the specific value under test lives in the it() itself
it('blocks when the player is already owned', () => {
  const transfer = makeTransfer({ ...requiredContext, playerIn: PLAYER_OWNED_BY_ANOTHER });
  expect(ownershipLimit(transfer).passed).toBe(false);
});

it('passes when the player is a free agent', () => {
  const transfer = makeTransfer({ ...requiredContext, playerIn: PLAYER_FREE_AGENT });
  expect(ownershipLimit(transfer).passed).toBe(true);
});
```

For validators and services that share a common setup, put shared fixture factories in a `fixtures.ts` file co-located with the tests. Keep that file focused on construction — no assertions, no test logic.

### Test framework

Vitest is the standard choice for this project (Vite-native, fast, compatible with the existing build). Add it when writing the first test:

```bash
yarn workspace draft add -D vitest
```

Run tests with:
```bash
yarn workspace draft vitest run
```

---

## Code Structure Rules

### New features belong in their domain folder

A new feature lives entirely within its domain folder — route file, components, types, lib, server logic. Do not scatter pieces across unrelated domains.

```
# Good — scoring feature in scoring domain
draft/app/scoring/lib/new-calculation.ts
draft/app/scoring/types/new-types.ts

# Bad — scoring logic leaked into _shared
draft/app/_shared/lib/new-calculation.ts
```

### Shared code earns its place in `_shared/`

Only move code to `_shared/` if it is genuinely used by two or more separate domains and contains no domain-specific business logic. FPL API access, cache utilities, and Google Sheets clients belong there. Team roster logic does not.

### Types live in the domain that owns the concept

Each domain has a `types/` folder. Types defined there can be imported by other domains, but the definition stays with the owning domain.

```
# Good
import type { TransferType } from '../transfers/types/transfer-types'

# Bad — duplicating the type in another domain's types folder
```

### Do not change the data layer without documenting the cache impact

Every data read is cached. If you change what a loader fetches, or add a new data source, update `cache-config.ts` with the appropriate TTL and invalidation rule. Undocumented cache behaviour causes stale data bugs.

---

## Coding Standards

### TypeScript is non-negotiable

All new files are TypeScript. No `any` unless there is an explicit comment explaining why. Prefer narrow types over wide ones.

### Biome is the linter and formatter

Run `yarn check:fix` before committing. The pre-commit hook runs Biome automatically. Do not introduce ESLint or Prettier config — Biome replaces both.

### CSS Modules for all styles

All component styles use CSS Modules (`.module.css`). No inline styles, no global class names, no Tailwind. Shared design tokens live in `design-tokens.css`.

### React Router loaders own data fetching

All server-side data fetching happens in React Router loader functions (`.route.tsx` files). Components do not fetch data directly on the server. Client-side re-fetching uses TanStack Query.

### Do not add new dependencies lightly

Check whether an existing library already solves the problem. If adding a new dependency, use an exact or pinned version. Flag it in the PR description with a justification.

---

## Domain Knowledge for New Contributors

### The points system is custom, not FPL's

This app uses its own position-based scoring system, not Fantasy Premier League's default points. Rules are defined in `scoring/lib/rules.ts`. Midfielders, wide attackers, and centre attackers score differently from defenders and goalkeepers. When working on scoring, always read `POSITION_RULES` first.

### Google Sheets is the source of truth for league decisions

Player ownership, transfer approvals, division assignments, and draft picks all live in Google Sheets. The app reads from Sheets and caches aggressively. If data looks stale, the cache TTL or invalidation rule is the first place to look.

### The draft is division-scoped

Each division runs its own snake draft independently. A player can only be owned once within a division. The draft state is tracked in both Google Sheets and Firebase Realtime Database — a sync comparison mechanism exists to catch drift between the two.

### Transfers go through an approval workflow

Managers submit transfers via the UI. They start as `PENDING` in Google Sheets. An admin approves or rejects them via `/admin/transfers`. Only `APPROVED` transfers are applied to rosters.

### There are three divisions with promotion and relegation

`premierLeague` > `championship` > `leagueOne`. Season-end: each division's winner is promoted, loser is relegated. Features that touch standings or end-of-season logic need to account for all three divisions.
