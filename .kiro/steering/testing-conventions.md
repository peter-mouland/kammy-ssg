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

### No module mocks — substitute at a real boundary

Do not mock modules or functions. No `vi.mock('../some-module')`, no stubbing individual exports, no replacing a data layer with a jest-style double.

- Use real scoring logic with real inputs
- Use real validation functions with real transfer data
- Use real loader logic, with the substitution made at a boundary the system genuinely has

The goal is that a passing test means the real behaviour works, not just that the wiring is correct. Every module mock you write is a claim about how the code is assembled, and it goes stale the moment someone rearranges it.

**The distinction that matters is not "mock vs no mock" — it is *where* you substitute.**

Replacing a module is a fiction: you are asserting that some internal function exists and behaves a certain way. Replacing a **network response** is not a fiction — the network is a real boundary the app crosses, and something on the other side really does return bytes. Substituting there leaves all of your own code running.

### MSW is the standard for anything crossing the network

**Any test involving an HTTP request or response uses [MSW](https://mswjs.io/) (`msw/node`, `setupServer`).** This is the gold standard for this codebase, not a fallback.

MSW intercepts at the network layer rather than patching `fetch`, so everything between your code and the wire still executes for real:

- the real FPL client, including its URL building, headers and retry behaviour
- the real `googleapis` Sheets client, including auth and its response parsing
- the real error handling for a 500, a timeout, or a malformed payload

That is strictly *more* real coverage than injecting a fake client, because a fake client skips all of the above and only proves that your interpretation code works when handed a perfect object.

```ts
// Good — substitute the network, run everything else for real
const server = setupServer(
    http.get('https://fantasy.premierleague.com/api/bootstrap-static/', () =>
        HttpResponse.json(bootstrapFixture),
    ),
);

// Bad — a fiction about how the module is built, stale after any refactor
vi.mock('../../_shared/lib/fpl/api-cache');
```

**Test the unhappy paths too.** MSW makes them cheap and they are where real bugs live: a non-200, a payload missing a field, a network error. If a loader has never been tested against a 500 from FPL, nobody knows what a manager sees when FPL is down.

**What MSW does not replace.** Passing fixture data straight into a pure function is still the right thing for scoring, validators and rules — there is no network there to intercept. Reach for MSW when the code under test genuinely makes a request.

### What to test

| Domain | What to test |
|---|---|
| `scoring/` | That given a stat line and a position, the correct points are calculated. Test edge cases in `POSITION_RULES` (e.g. saves threshold, goals conceded penalty). |
| `transfers/` | That valid transfers are accepted and invalid ones are rejected. Test all `TransferType` variants. |
| `draft/` | That snake draft order is generated correctly. That the same player cannot be picked twice in the same division. |
| Route loaders | That the loader returns the correct shape of data for a given URL and division. Use MSW for the Sheets/FPL calls underneath. |
| `_shared/lib/` | Only the cache invalidation logic and TTL config — these have real business impact. |
| FPL + Sheets clients | Behaviour against real payloads via MSW: a good response, a 500, a timeout, and a payload missing a field. These are the app's only external dependencies and the only place it can be broken by someone else. |

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

**MSW** (`msw/node`) is the network boundary — see *MSW is the standard for anything crossing the network* above. A test that needs it starts a server per file and asserts every request was accounted for:

```ts
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`onUnhandledRequest: 'error'` is not optional. Without it a request you forgot to handle escapes to the real internet, and the test either hits live FPL or fails slowly and confusingly. With it, an unhandled request fails immediately and tells you which URL it was.

### Testing a route loader

Loaders are the boundary principle 2 calls the most valuable, and `cup/cup.route.test.ts` is the worked example. Call the loader with a real `Request` and assert the data the page receives — never how the loader is assembled, so the test survives it being rearranged.

```ts
const load = async (search = '') => {
    const result = await route.loader({ request: new Request(`http://localhost/cup${search}`) } as Parameters<
        typeof route.loader
    >[0]);
    return (result as { data: ... }).data;
};
```

Worth testing for every loader, because these are where a page silently degrades:

- what a query parameter changes (`?gameweek=2`)
- what the page gets when a sheet is empty or unconfigured
- what the page gets when a read **fails** — most loaders have a try/catch fallback that nothing exercises

A loader test needs the Sheets harness below, plus any FPL values seeded into `dataCache`.

### The Google Sheets harness

Sheets tests use `_shared/test/google-sheets-msw.ts` rather than hand-rolling handlers. Two things about it are not guessable:

1. **Auth signs locally.** `google.auth.JWT` signs a JWT with the service account's private key *before* exchanging it for a token, so a test needs a real (throwaway) RSA key — `fakeServiceAccount()` generates one per worker. Nothing verifies the signature; the client just will not reach the network without one, and it is 1024-bit for that reason.
2. **Credentials are already set for you.** `vitest.setup.ts` calls `useFakeSheetsCredentials()` before any test file's imports run, so **import the module under test normally**. A test should not call it itself.

```ts
import * as sheets from './cup-sheets';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
    server.resetHandlers();
    dataCache.clear(); // every sheet read is cached, or test 2 sees test 1's rows
});
```

**This used to be a dynamic `await import()` inside `beforeAll`, and that is worth knowing about**, because the same trap is available elsewhere. `sheets/utils/common.ts` reads `GOOGLE_SHEETS_ID` at module scope and memoises its client, so tests imported it late to guarantee the fake credentials existed first. That put the Sheets client's import inside a hook — and at the time that was `import { google } from 'googleapis'`, which cost **1.7s** because it loaded Google's entire API surface to talk to one spreadsheet. (That dependency has since been swapped for the scoped `@googleapis/sheets`, ~78ms.) Under parallel workers that blew vitest's 10s `hookTimeout` often enough to fail about **one `yarn test` run in three**, which gated the pre-commit hook and reddened CI for reasons unrelated to the change under test.

The lesson generalises: **keep expensive module loading out of `beforeAll`.** A hook has a timeout; module collection does not. If a hook needs environment set up first, set it in `vitest.setup.ts` and import normally.

**Where the network is not the boundary.** `fplApiCache` reads from Firestore over gRPC, which MSW cannot intercept. Seed the app's own in-memory cache instead — `dataCache.get(key, async () => fixture)` populates it through the real API, so the fetcher never runs and everything downstream still executes. Same idea one layer up, and still not a module mock.
