---
inclusion: always
---

# Testing Conventions

## Philosophy

**1. Consumer-focused testing (Kent C. Dodds / Testing Trophy)**
Tests should resemble how a real user interacts with the software. Prefer integration-style tests that exercise real behaviour through real boundaries. Avoid testing implementation details.

**2. Test at the boundaries (Google SRE)**
The most valuable place to test is where your code meets the outside world: route loaders, scoring calculation functions, transfer validation logic, cache invalidation. Not internal helper functions, not React component internals.

**3. Domain-driven structure**
Code is organised vertically by domain (teams, scoring, transfers, draft, players, leagues) with shared horizontal concerns in `_shared/`. New code belongs in the domain it affects. This applies equally to tests — they live next to the code they cover.

---

## Rules

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

---

## Testing components

"Not React component internals" above means do not test *internals* — it does not mean do not render. Rendering a component and asserting what a user sees is exactly the integration-style testing principle 1 asks for, and it is where UI bugs actually live.

A tooltip on the player table once reported "0 points" for every player for as long as it existed. Nothing rendered it in a test, so nothing noticed.

**Test what a user sees, not how the component is built:**

```tsx
// Good — what a user would look at
expect(screen.getByTitle('2 points')).toBeDefined();
expect(screen.getByRole('row', { name: /Salah/ })).toBeDefined();

// Bad — the component's internals
expect(columns[7].title(stat, col, 0)).toBe('2 points');
expect(wrapper.state.sortDirection).toBe('asc');
```

Good things to assert: which columns a position shows, what a cell displays for a given stat, what a tooltip says, what an empty list renders. Avoid asserting prop plumbing, internal state, or the order of a `columns` array.

### Rendering tests opt in to a DOM

The default environment is `node`, which keeps the logic tests fast. A test that renders declares a DOM at the top of the file:

```tsx
// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
```

happy-dom rather than jsdom because it is significantly faster and covers everything this app renders. If a file ever needs something happy-dom lacks (layout measurement, canvas), it can opt into `jsdom` the same way.

`vitest.setup.ts` calls Testing Library's `cleanup()` after every test, so rendered output does not leak between them.

---

## Framework

Vitest is the standard choice for this project (Vite-native, fast, compatible with the existing build). Configuration lives in `draft/vitest.config.ts` — deliberately separate from `vite.config.ts`, because a test run has no use for the React Router route manifest.

Run tests with:
```bash
yarn test
```
