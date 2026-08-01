# Regression-testing the site offline: a fixture server, a fake clock, and four test layers

**Status:** approved plan, not yet built. Progress is tracked per component in
[testing-progress.md](testing-progress.md) — that document is the one to read first, and the one to
update as work lands. This one explains the *why* behind each piece of setup.

**This is not a steering file.** Read it when planning harness work, not when doing unrelated work.

## Context

Loading the site today gives 500s, and there is no way to tell whether the code broke or the data is
simply not there yet. That question is unanswerable because there is no run of the app whose data is
known-good. Everything the app reads comes from Google Sheets, the FPL API or Firestore, and Firestore is
currently empty.

The app also behaves differently depending on when you look at it — 92 `new Date()` / `Date.now()` sites
across 40 files decide deadlines, submission windows and eligibility — and `api-cache.ts:233` takes the
current gameweek from FPL's frozen `is_current` flag rather than from a date. So even with good data,
out-of-season the site only ever shows one state.

Meanwhile there is a season of captured data that almost nothing consumes — now split between tracked
[`test-fixtures/`](../test-fixtures) and gitignored [`archive/`](../archive) — and 38 test files that
cover pure logic well and pages barely at all: one loader test (`cup.route.test.ts`) and one component
test.

**The outcome:** a real server, running the real SSR app, served entirely from fixtures, with the date as
a URL parameter — browsable by hand and drivable by Playwright. If that server is green and production is
red, the fault is data, not code. Storybook then covers rendering breadth on top.

---

## Which layer answers which question

| Layer | What runs for real | Question it answers | Blind to |
|---|---|---|---|
| **1. Logic tests** (existing 38 files, `yarn test`) | pure functions | "is a clean sheet 5 points for a full-back?" | anything involving I/O or rendering |
| **2. Loader tests** (`*.payload.test.ts`, new) | real loaders, real sheets client + scoring + transfer integration; MSW at the network, in-memory Firestore | "does the page get the right **data** on 2025-01-20?" | rendering, HTTP, route config, actions, hydration |
| **3. Storybook** (`*.stories.tsx`, new) | real page components in a real browser, fed layer 2's committed payloads | "does the UI **render** this data — including empty and locked states?" | all server wiring, SSR, navigation, actions |
| **4. Playwright** (against the fixture server, new) | **the whole stack** — Express, SSR, HTTP, route config, hydration, client navigation, form actions | "does the **site** work?" — and specifically "is a 500 our bug or missing data?" | the real external systems only |
| **5. Live contract checks** (small, on demand) | real FPL API + real Sheets, schema assertions only | "did FPL rename a field / did someone move a sheet column?" | nothing else — it asserts shape, not data |

Layers 2–4 all read the same fixture set and all take their date from the same clock, so a scenario is
defined once and exercised at every level.

**What remains uncovered after all five**, stated plainly:

- **Firestore's own behaviour** — the in-memory driver does not reproduce `Timestamp.toDate()`
  (handled at `fpl-firestore.ts:62-72`), `getAll` batch limits, or latency. Mitigated: `FIRESTORE_EMULATOR_HOST`
  works with zero code changes for anyone who installs Java, and the harness should run either way.
- **Firebase Realtime Database live draft sync** — multi-client real-time picks. `/draft` will render and
  read state from sheets, but live sync needs the RTDB emulator (Java again) or a second browser. Out of
  scope; name it in the spec so nobody assumes it is covered.
- **Real data quality** — the harness proves the code. Diagnosing production data is what
  `admin/server/services/system-status.service.ts` and `fplApiCache.getCacheHealth()` already exist for.
- **The season seam** — the harness runs 2425 FPL stats against 2526 sheets (see below), so points values
  are structurally correct but are not the real 25/26 numbers. Assert behaviour, not history.
- **Visual regression and performance** — no snapshots, no budgets, in this pass.

---

## What the fixtures actually contain

Measured, not assumed:

| | FPL | Sheets |
|---|---|---|
| **2024/25** | ✅ **complete finished season** — 38 events all `finished`, 804 players, per-gameweek history, full calendar. Now `test-fixtures/fpl/` | ⚠️ old schema (`setup/values/managers.json`, a `GameWeeks` tab, per-division squad tabs). Today's readers cannot read it. Left in `archive/` |
| **2025/26** | ❌ **pre-season 26/27 snapshot** — nothing `finished`, every element-summary has `history: []`. Cannot drive scoring. Left in `archive/` | ✅ **current schema, real 25/26 season** — 287 draft picks, 844 transfers, 24 managers. Now `test-fixtures/spreadsheets/` |

So the harness takes the **FPL half from 2024/25 and the league half from 2025/26**, in one flat
`test-fixtures/` with no season folders — no single season label was honest. What makes the pairing work:

1. **`code` is the join key, not `id`.** All 287 draft picks carry `Code`; **none** carry `Player ID`, and
   `handleCommitTeamsToFirestore` joins on code —
   `new Map(fplPlayers.map(p => [p.code, p]))` (`admin/server/actions/team-commit-actions.ts:31`). FPL codes
   are stable across seasons, so serving the 2024/25 pool yields consistent ids everywhere,
   element-summary lookups included. No remapping.
2. **Every rostered player resolves.** 262 players were rostered at some point; 54 of them have no 2024/25
   stats, and all 54 are generated into the same pool at ids 805–858 — 46 from real 2025/26 season totals,
   8 from a median stand-in season. See [test-fixtures/README.md](../test-fixtures/README.md) for the
   provenance tiers and what is invented.
3. **The pool is 1:1 with the sheet.** 458 players, 458 summaries. The 114 never-rostered players with no
   stats were pruned, so a missing summary now means a broken fixture rather than a routine gap.

Gameweek *numbers* align between the halves (the app keys by GW number; dates enter only via deadlines), so
GW21 means the sheet's GW21 roster against 2024/25's January-2025 deadline. Documented seam, invisible to
the code.

---

## Part A — The clock — ✅ built

`draft/app/_shared/lib/clock.ts`, with `runWithNow` split into `clock.server.ts`: `node:async_hooks`
does not exist in a browser bundle and `clock.ts` is imported by client components. Importing the
server file installs the resolver into the shared clock; verified that `async_hooks` stays out of
`build/client`.

Both the server and the browser need it, so it resolves from several places:

```ts
export function now(): Date;
export function nowMs(): number;
export function setNow(d: Date | string | null): void;   // tests, Storybook
export function runWithNow<T>(d: Date, fn: () => T): T;  // per-request, server only
```

Resolution order: `runWithNow` scope (an `AsyncLocalStorage` store) → explicit `setNow()` →
`process.env.KAMMY_FAKE_NOW` → `globalThis.__KAMMY_NOW__` (browser) → real `Date`. Production sets none
of these, so `now()` is `new Date()` there; say so in the file header.

`runWithNow` is what makes per-request time travel work: one fixture server serves any date, so
Playwright can run dates in parallel and you can hand-drive the season in a browser. `setNow()` stays for
the Node and Storybook layers, where a process is a scenario.

**Replace `new Date()` at decision sites only.** The estimate of 25–30 was far too high: read one by one,
almost every `new Date()` in the files below is a **write stamp** (`assignedAt`, `generatedAt`,
`appliedAt`, `onLoanStart`), which the "leave alone" list already covers. Only **seven** were genuine
decision inputs, and all seven are now converted:

- `cup/lib/cup-deadlines.ts` ×2 — already took an injected `now`; only the default changed.
- `cup/server/cup.server.ts` ×2 — `input.now ?? clockNow()`.
- `transfers/lib/get-gameweek-limit-status.ts`, `components/transfer-form.tsx`,
  `components/player-in-selector.tsx` — each builds a **candidate** transfer whose `timestamp` is fed to
  the validators to decide gameweek eligibility. It looks like a stamp and is not one.

`validators/fixtures.ts`'s `makeGameweek()` is test-data construction and was deliberately left alone.
The original list, kept because the remaining files are still worth a second pass:

- `_shared/lib/fpl/gameweeks.ts` — `isCurrent` / `hasPassed`; accept an optional `now`.
- `transfers/lib/get-gameweek-limit-status.ts`, `lib/validators/fixtures.ts`,
  `transfer-integration.service.ts`, `transfer-processor.service.ts`, `server/actions/submit-transfer.action.ts`.
- `transfers/components/transfer-form.tsx`, `components/player-in-selector.tsx` (client).
- `draft/server/draft.server.ts`, `draft/draft.tsx`, `draft/lib/use-optimistic-picks.ts`.
- `teams/lib/roster-conversion-utils.ts`, `scoring/lib/generators.ts`.

**Leave alone:** `data-cache.service.ts` and `sheets/cache/utils.ts` (TTL arithmetic — moving the clock
under a TTL would expire or freeze caches as a side effect of time travel), `lastUpdated` writes, job ids,
`toast-manager.tsx`, `error-boundary.tsx`.

**Make the current gameweek clock-derived.** Without this the clock moves deadlines but never the
gameweek, and out of season every page stays on its empty state no matter what date you ask for.

- Add `recomputeGameweekFlags(events, now)` to `gameweeks.ts`, extracted from the existing
  `getGameweekData` logic (`isCurrent` = `now` between the previous and this deadline).
- Apply it **on read, outside the cache callback**, in `api-cache.ts`'s `getFplEvents()`: `fpl:events` has
  a 4h TTL and the stored document's flags were frozen when `populateEvents` ran, so recomputing inside the
  cached fetcher would pin them to whenever the cache filled. This is also what lets one server answer two
  requests at two dates.
- `getCurrentGameweekData()` prefers the recomputed `isCurrent`, falling back to `fplEvent.is_current`.

**The recompute only runs under a fake clock** (`isFakeNow()`), which the plan did not say and which
matters. The app's own date math and FPL's `is_current` genuinely disagree: a gameweek is "current" here
from the *previous* deadline to its own — the window you pick a team in — whereas FPL's flag tracks
matches in progress. Recomputing unconditionally would therefore change which gameweek production
considers current, which is a real behaviour change this work has no business making. Under a fake clock
there is no such risk and no alternative: the harness replays a finished season where every `is_current`
is false, so without the date-derived flag no date has a current gameweek and every page is empty forever.

*[Separate problem found]* The stored `isCurrent` in Firestore has always been frozen at whenever
`populateEvents` last ran, since `getGameweekData` computed it with `new Date()` at write time. Nothing
reads it in production (`getCurrentGameweekData` used FPL's flag), so this is latent rather than broken —
but any new caller trusting `event.isCurrent` in production would get a stale answer.

**Hydration.** If the server renders at a fake date and the client uses the real one, React will mismatch.
So the root loader returns `fakeNow` (null in production) and `root.tsx`'s `Layout` emits
`window.__KAMMY_NOW__ = "…"` in a small inline script ahead of hydration, only when it is set.

Tests: `clock.test.ts`, plus `gameweeks.test.ts` (none exists) asserting GW21 is current on 2025-01-20 and
GW1 on 2024-08-15 against the real 2425 events.

## Part B — The fixture data layer — ✅ built

`draft/app/_shared/test/fixtures/season-fixtures.ts` — Node-only readers over `test-fixtures/`, which
is now the single tracked root (raw captures live in gitignored `archive/`): `sheetTab(name)`,
`fplBootstrap()` (merged), `fplFixtures()`, `elementSummary(id)`, plus `elementSummaryIds()` and
`gameweekLive(gw)` that the plan did not anticipate — see the live-data note below.

The range→tab parsing came out to `_shared/test/sheet-range.ts` and is shared by both MSW layers, as
planned. It gained `startRowFromRange()`: `values.update` is used in two shapes, a whole-tab overwrite
(`'Cup'!A:G`) and a single targeted row (`'Draft'!A12:M12`), and the row-targeted form is how a transfer
gets approved — without it an approval would overwrite the header row.

**Live gameweek data has to be derived, and the plan missed that it was needed at all.** There is no
capture and there cannot be one: `event/{gw}/live/` only ever serves the current gameweek. But a live
element is `{ id, stats }` where `stats` is the same per-gameweek stat line the element-summary history
holds, so the round-N row of every summary *is* the live payload for gameweek N. Two loaders read it
(`leagues/server/team-of-the-week.server.ts:26`, `players/server/players.server.ts:60`) and an empty list
would put every player on zero — indistinguishable from a scoring bug.

**The merged element pool** is now a concatenation rather than a computation — the synthesis already
happened and is committed:

```
test-fixtures/fpl/bootstrap-static.json   .elements   (804, real 2024/25)
test-fixtures/fpl/synthetic-elements.json .elements   (54, ids 805-858)
```

The merge is required because `FplFirestore.populateBootstrap()` filters elements to codes present in the
`Players` sheet (`fpl-firestore.ts:198`); without the twelve, those roster slots cannot resolve at all.

**`elementSummary(id)` no longer needs a fallback for missing data, but should still have one.**
`players.json` and `element-summary/` are now 1:1 at 458 each — the 114 never-rostered players with no stats
were pruned — so a missing summary means a broken fixture, not a routine gap. Return
`{ fixtures: [], history: [] }` and log loudly rather than throwing.

`draft/app/_shared/test/fixtures/fixture-msw-handlers.ts`:

- **Sheets, and stateful.** `FixtureSheetStore` loads a tab on first read and mutates in memory after, so
  `append` and `update` are visible to the next read and `reset()` returns to the captured rows. Nothing
  writes to `test-fixtures/` on disk, and a test asserts that. Resolution is tab →
  `test-fixtures/spreadsheets/<slug>.json` with the shared slug below, which must be *exactly* this one —
  the fixtures were renamed with it:

  ```ts
  const slug = (tab: string) =>
      tab.replace(/([a-z0-9])([A-Z])/g, '$1-$2')   // camelCase boundary: leagueOne -> league-One
         .replace(/[^a-zA-Z0-9]+/g, '-')            // spaces, underscores, slashes
         .replace(/^-|-$/g, '')
         .toLowerCase();
  ```

  It has to handle all four naming styles the real tabs use: `UserTeams` → `user-teams`,
  `premierLeague-transfers` → `premier-league-transfers`, `FPL Team Codes` → `fpl-team-codes`,
  `FPL_Player_export` → `fpl-player-export`. A missing file should throw with the tab name *and* the slug
  it looked for, because a silent `[]` looks exactly like an empty sheet.

  **Writes mutate an in-memory copy** rather than being swallowed: `append` pushes a row, `update` replaces
  a range. Without this, a submitted transfer vanishes on reload and no action can be tested end-to-end —
  this is the difference between Playwright testing forms and Playwright testing form *rendering*.
- **FPL:** `bootstrap-static/` (merged), `fixtures/`, `element-summary/:id/`, `event/:gw/live/`.
- `onUnhandledRequest: 'error'` in tests, per the testing conventions; on the fixture server, log loudly —
  an unhandled request there means the app reaches a network the harness does not know about, which is
  itself a finding.

**Firestore — ✅ built.** `_shared/lib/firestore-cache/firestore-memory.ts`, selected inside
`getFirestoreInstance()` when `KAMMY_FIXTURE_FIRESTORE=1`. MSW cannot intercept gRPC, there is no Java on
this machine (`java -version` fails), and there is nothing in Firebase to seed from, so this is the
zero-install default; `FIRESTORE_EMULATOR_HOST` still works unchanged for anyone who has Java.

It implements exactly the eight calls the app makes and throws on anything else, so a new call site is a
loud failure rather than a silent empty read: `collection(n).doc(id)` → `.get()/.set()/.update()`;
`db.getAll(...refs)`; `collection(n).select().get()`; `collection(n).count().get()`;
`collection(n).where(f,op,v).get()`; `collection(n).limit(1).get()`; `db.batch()` →
`.set()/.delete()/.commit()`. Writes go through a JSON round-trip, so shape drift surfaces as it would over
the wire and reads cannot hand out a mutable reference into the store. Documents are ordered by id, matching
Firestore's default `__name__` ordering, which is what makes a harness run reproducible.

Two behaviours are deliberately not reproduced and are pinned by tests rather than assumed: a `Date` comes
back as an ISO string, not a `Timestamp` with `.toDate()` (`fpl-firestore.ts:62-72` accepts both, which is
why events survive it), and there are no `getAll` batch limits, transactions or latency. That is G19.

Persistence is left to the caller: `dumpInMemoryFirestore()` / `loadInMemoryFirestore()` return and accept
plain JSON, so Part D can persist to a gitignored `.harness/firestore.json` and skip the rebuild while this
module stays free of `fs` and usable from a test worker. `resetInMemoryFirestore()` clears it between
scenarios.

## Part C — Rebuilding the season from local data — ✅ built

`draft/harness/rebuild-season.ts`. **Outside `app/` deliberately**: it has to reach both `admin` and
`scoring`, and nothing inside the app may orchestrate two domains (`architecture.test.ts` rule 1). It
still goes through published APIs only — `admin/index.server`, `scoring/index.server` — never a domain's
internals. `vitest.config.ts` gained `harness/**/*.test.ts` so it runs with everything else.

**A full season costs 6.8 seconds, not the minutes the plan budgeted for** — 117 documents, 3 divisions
× GW0–38, all real code. Two consequences: the whole rebuild stays on the pre-commit hook rather than
being trimmed to a few gameweeks, and **Part D does not need `.harness/` persistence** — the fixture
server can just rebuild at boot. The `dumpInMemoryFirestore()` / `loadInMemoryFirestore()` pair added in
Part B is still there if a future run gets slower, but nothing needs it today.

Firebase is empty, so the harness reconstructs the derived data — using the app's own pipeline, which
makes this the single biggest coverage win here. The harness only orchestrates existing code:

1. `FplFirestore.populateBootstrap()` → `fpl-bootstrap/{teams,events,elements}` from the merged bootstrap
   (over MSW) and the `Players` sheet; `populateEvents` runs the real `getGameweekData`.
2. `handleCommitTeamsToFirestore(divisionId)` × 3 (`admin/server/actions/team-commit-actions.ts:12`) → the
   GW0 documents, from the 288 draft picks joined by code.
3. For gw 1…38 per division: `upsertDivisionTeamsDocument` (`scoring/index.server.ts:29`), which copies
   forward applying **approved transfers** through the real `applyTransfersToGameweekDocument`, then the
   points path from `admin/libs/background-jobs.server.ts:124` — real element-summary stats over MSW, real
   `POSITION_RULES` scoring.

Element-summaries load once into `dataCache`, so expect seconds — measured at 6.8s for the full 38. Do
**not** commit the resulting documents (117 docs × 24 teams × 13 slots is tens of MB); they are
deterministic given a fixed clock, and cheap enough to just rebuild.

This step is shared: the fixture server runs it at boot, and the loader tests run it in-process.

**The rebuild does not depend on the clock, and Part D's design rests on that.** Measured, not assumed:
rebuilt at GW1 and again past the final deadline, `division-teams` is **byte-identical** across all 117
documents and 13MB. Gameweek numbers come from the loop, transfers are assigned to gameweeks by their own
timestamps against the calendar, and points come from each player's history row for that gameweek number
— nothing consults `now()`. The only clock-dependent output is the three stored flags on
`fpl-bootstrap/events`, and those are re-derived on every read under a fake clock, so they are inert.

So the fixture server rebuilds **once** at boot and serves every `?now=` from the same data. The clock
chooses which slice a page reads; it does not change what is stored. `rebuild-determinism.test.ts` guards
it, because if it ever stopped being true every date after the first would quietly get data built for a
different one — which would present as a scoring bug.

**What building it actually found:**

- **`update()` is called with dotted field paths** — `background-jobs.server.ts:139` writes `teams`
  alongside three `metadata.*` paths in one call. The in-memory Firestore threw on these, exactly as it
  was designed to, rather than writing junk top-level keys and leaving `pointsLastGameweek` unset. Now
  implemented as real nested-field writes, with a test.
- **`calculateSingleTeamPoints`'s signature does not match its production caller.** `teams[userId]` is
  `{ roster }` against a `TeamGameweekData` parameter, and `previousDivisionDoc` is null at GW1. The
  harness passes exactly what `background-jobs.server.ts` passes and casts, rather than "fixing" the call
  — tightening that signature is a change to the app. *[Will slow down future work]*
- **`scoring/lib/generators.ts:103` logs `console.error` for a normal condition** — a player with no
  history row for a gameweek (injured, or not yet in the league). A full-season rebuild emits hundreds of
  these. Harmless, but it makes real errors hard to spot in harness output. *[Polish]*

## Part D — The fixture server (`yarn dev:fixtures`)

The deliverable that answers your immediate question, and the one that is useful before a single test
exists: **a real server serving the real app entirely from fixtures, with the date in the URL.**

New `draft/harness/server.mjs`, modelled directly on `functions/src/ssr.ts` — same Express +
`@react-router/express` shape, so the harness exercises the same wiring production uses, including its
`getLoadContext: (req) => req.body` body pass-through (which is how form actions receive data in prod, and
therefore has to be replicated or actions behave differently here than live):

```
1. start MSW (setupServer) with the fixture handlers          → FPL + Sheets served locally
2. KAMMY_FIXTURE_FIRESTORE=1                                   → in-memory Firestore
3. Part C: rebuild the season, or load .harness/               → division-teams populated
4. middleware: ?now=<iso> → cookie → runWithNow(...)           → per-request time travel
5. express.static(build/client) + createRequestHandler(build/server/index.js)
```

Add `express` and `@react-router/express` to `draft`'s devDependencies, matching the versions
`functions/package.json` already pins. Two scripts:

- `yarn dev:fixtures` — build once, then serve. Closest to production and fast for Playwright.
- `yarn dev:fixtures --watch` — the same harness wrapped around `react-router dev`'s Vite server, for
  iterating on UI against fixture data.

Using it by hand: `http://localhost:3100/leagues?now=2025-01-20` sets a cookie and every page then renders
as if it were 20 January 2025 — mid-season, GW21, cup league stage. Drop the cookie to return to real time.

**This is the diagnosis you asked for.** Green here with red in production means the fault is data, not
code, and the 500s stop being ambiguous.

## Part E — Playwright

New `playwright.config.ts` at the repo root, `webServer` running `yarn dev:fixtures` on a fixed port, one
project (chromium) to start. Specs live in `e2e/`, outside `draft/app/` so `architecture.test.ts` and the
vitest `include` glob stay untouched.

**E1 — the route crawl (write this first).** Enumerate every route from `routes.ts` — 18 pages plus
`players.json`, `/scoring/api/gw-points`, `/api/transfers/:divisionId`, `/api/cache` — and at three dates
(`preseason`, `cup-league-gw21`, `season-end`) assert: HTTP 200, no error-boundary text, no uncaught console
error, no failed request. That single spec is the regression net you are missing and the direct answer to
"did we break it".

**E2 — date behaviour through the UI.** The same scenarios as layer 2, asserted where a manager would see
them: the `TimeTravelBanner` appears off-current-gameweek (`league-standings.tsx:127`), the transfer form is
open at `2024-08-16T12:00` and locked at `18:00`, cup squads are hidden before the deadline and revealed
after, GW38 shows promotion/relegation markers.

**E3 — actions, which nothing else can reach.** Submit a transfer and see it appear as `PENDING`; approve it
in `/admin/transfers` and see the roster change; submit a cup squad and see it locked out after the
deadline; run points processing from `/admin/points`. These work only because Part B's sheet store is
mutable, and they are the highest-value specs here because a POST path has never been tested at all.

**E4 — navigation and hydration.** Click through the nav, use the gameweek selector, change division — the
things that break in SSR mode and are invisible to every other layer.

`/draft` gets a render-and-read assertion only; live RTDB sync is out of scope (see the gaps).

## Part F — Storybook

Add to `draft/`, pinned exact, flagged in the PR description: `storybook`, `@storybook/react-vite`,
`@storybook/addon-vitest`, and `playwright` (already present from Part E). The vitest addon runs stories in
a real browser as a second vitest project, reusing the existing vitest install.

Storybook's job here is **breadth of rendering states**, not correctness of wiring — the states that are
tedious to reach through a server: a division with no data, a manager with an empty roster, a locked cup
tie, a player with `noData` points, every position's column set. It reads the payloads layer 2 commits, so
its data is real loader output rather than invented.

- `draft/.storybook/main.ts` — react-vite builder, stories `../app/**/*.stories.tsx`. `viteFinal` must drop
  the `reactRouter()` plugin, for the same reason `vitest.config.ts` loads no plugins: the route manifest is
  meaningless here.
- `draft/.storybook/preview.tsx` decorators, outermost first: **clock** (a `now` global with a toolbar date
  picker, defaulting to the story's scenario, calling `setNow()`); **router** — `createRoutesStub` from
  `react-router` (confirmed present in the installed 7.10.1), which is what supplies `useLoaderData`,
  `useSearchParams`, `useNavigate` and `Link` used by every page (`cup.page.tsx:106`,
  `league-standings.tsx:65`, `team-view.tsx:18`, `transfers.page.tsx:25`); **TanStack Query** provider, as
  `root.tsx`'s `Layout` provides in the app; **styles** — `design-tokens.css` and `root.css`.
- A `makePageStory({ route, page, scenario, search })` helper keeps each story to three lines.
- A story may **not** import another domain's fixtures — the `architecture.test.ts` exemption at line 178
  matches `.test.tsx?` only. Keep stories to their own domain plus `_shared`; if that bites, widen the
  pattern deliberately and note it in `.kiro/backlog.md`.

## Part G — Scenarios and the loader tests

New `draft/app/_shared/test/scenarios.ts` — one table, pure data, importing nothing from a domain
(`architecture.test.ts` rule 1). Shared by layers 2, 3 and 4. Dates are on 2425's calendar:

**Corrected against the real 2024/25 calendar** — the original dates below did not produce the
gameweeks they claimed, which `gameweeks.test.ts` now pins. Each row states the gameweek it
*actually* yields:

| scenario | now | current GW | exercises |
|---|---|---|---|
| `preseason` | 2024-08-01 | **1** | pre-deadline GW1, **not** an empty state — see below |
| `gw1-deadline-day` | 2024-08-16T12:00Z | 1 | submission open, deadline 5.5h away |
| `gw1-locked` | 2024-08-16T18:00Z | 2 | just past GW1's deadline, teams revealed |
| `cup-league` | 2025-01-10 | **21** | cup league stage (`CupConfig`: league = 21,22,23) |
| `cup-r16-leg1` | 2025-01-29 | **24** | two-legged round (r16 = 24,25), player-reuse ban |
| `season-end` | 2025-05-26 | **none by date → 38** | past the last deadline; falls back to FPL's frozen flag |

Three corrections worth understanding rather than just copying:

- **There is no "no gameweek yet" state at the start of a season.** GW1's window opens at a hardcoded
  floor (`2023-07-30T11:00:00.000Z` in `gameweeks.ts`), so *every* date before GW1's deadline reports GW1
  as current. `preseason` gets pre-deadline GW1, which is still a useful state — nothing played, submission
  open — but it is not the empty state the plan assumed. The only genuine no-current-gameweek state is
  **after** the final deadline.
- **2025-01-20 is GW23, not GW21.** GW21's deadline was the 14th and GW22's the 18th. The date is still
  inside the cup league stage, so the scenario's *intent* held by luck. To actually get GW21, the date has
  to fall between GW20's deadline (2025-01-04T11:00Z) and GW21's (2025-01-14T18:00Z) — hence 2025-01-10.
- **`season-end` has no current gameweek by date at all**, and only reports GW38 because
  `getCurrentGameweekData()` falls through to FPL's frozen `is_current`, which happens to be GW38 in the
  captured bootstrap. That is the right answer by the wrong road; if the fallback is ever removed, this
  scenario silently becomes "no gameweek".

One payload test per route, co-located in its own domain (`cup/cup.payload.test.ts`,
`leagues/league-standings.payload.test.ts`, `teams/team.payload.test.ts`, …) — co-located because a
`_shared` file may not import a domain, and following `cup/cup.route.test.ts` as the worked example. Per
scenario: `setNow()`, `dataCache.clear()`, MSW up, then call the **real** exported `loader` with a real
`Request` exactly as `cup.route.test.ts:44` does, and assert what the page receives — current gameweek
follows the clock (`21` at `cup-league-gw21`, `0` at `preseason`), cup open/locked, stage and leg, standings
row counts, and the 13 stat-less players scoring 0 with `noData` rather than breaking a roster. Payloads are
written to `_shared/test/story-data/<route>.<scenario>.json` under `UPDATE_STORY_DATA=1`; otherwise the
committed file must still match, so a loader change that silently alters page data fails CI.

These need Part C's state, so they run as their own project: `draft/vitest.harness.config.ts`
(`app/**/*.payload.test.ts`, same setup file), behind `yarn harness`. `yarn test` stays as it is today.

## Part H — Live contract checks (small, and the only thing that catches drift)

`e2e/contracts/` or a tagged vitest file, run on demand and nightly, never in the pre-commit hook: hit the
real FPL `bootstrap-static/` and the real spreadsheet, and assert **shape only** — the fields
`_shared/lib/fpl/fpl-types.ts` relies on exist; every tab the readers open exists with the expected header
row. No data assertions, so it is stable. This is the only layer that catches "FPL renamed a field" or
"someone inserted a column", which is precisely the class of failure frozen fixtures can never see.

---

## Part I — `.kiro/testing-progress.md` (write this first)

The Parts above describe *setup*. All of it could be finished while covering nothing anyone cares about,
so the first deliverable is the document that tracks coverage per **component**, not per part. It lives at
`.kiro/testing-progress.md`, next to `backlog.md`, and like the backlog it is not a steering file — read
when planning, not when doing.

**Rows** are the things that can break, grouped and enumerated from the code:

| group | count today | notes |
|---|---|---|
| Pages | 20 | every entry in `routes.ts`, including the six `/admin` children |
| Data endpoints | 6 | `players.json`, `players/:code.json`, `scoring/api/gw-points`, `api/transfers/:div`, `api/cache`, `api/admin/draft-sync-comparisons` |
| Loaders / actions | 19 / 7 | the admin children share `admin.route.tsx`'s loader+action |
| Domain public APIs | ~55 runtime exports | from each `index.ts` / `index.server.ts`; type-only exports are excluded as untestable |
| Shared components | 13 | `_shared/components/` |
| Domain components | ~46 | the ones a page actually composes |
| Data readers | 11 sheet tabs + 4 FPL modules | `_shared/lib/sheets/*`, `_shared/lib/fpl/*` |
| Pipelines | 5 | season rebuild, points processing, transfer approval, snake draft, cup autopick+scoring |

**Columns**, each carrying a status:

`Responsible for` · `Unit` · `Data (loader payload)` · `Render (Storybook)` · `Site (Playwright)` ·
`Fixture data` · `Fixture validated` · `Harness-wired`

**Status vocabulary** — the point of which is that "doesn't need it" and "hasn't got it" must never look
the same:

| | meaning |
|---|---|
| `—` | **not needed** — and the row says why in one clause |
| `○` | **gap** — needed, absent. Every `○` is a task |
| `◐` | **partial** — some coverage with a named hole |
| `●` | **covered** |
| `▲` | **blocked** — needs something else first (e.g. `/draft` live sync needs the RTDB emulator) |

Two things keep it honest rather than decorative:

1. **A scoreboard at the top** — per group, the count in each column, so progress is one number that moves.
   Today's opening line is `Pages: data 1/20, render 0/20, site 0/20`.
2. **A gap register below the matrices** — every `○` gets an id (`G1`, `G2`…), a one-line task and which
   Part unblocks it. That is what makes the doc task-based: the matrix shows state, the register is the
   queue.

Desired coverage is encoded in the matrix itself, so the shape of the target is visible before any work
lands. First pass at the rules, to be applied row by row rather than assumed:

- **Every page** wants `Data` + `Site`. `Render` only where it has states a server cannot cheaply reach.
- **Every shared component** wants `Render` — they are reused, so a break is a break everywhere.
- **Every domain public API export** wants `Unit` *or* `Data`, never neither: it is a published contract.
- **Every data reader** wants `Unit` (against fixture payloads via MSW) plus `Fixture validated`.
- **Every action** wants `Site` — a POST path cannot be verified anywhere else.
- **Pure formatters and type-only exports** get `—`.

`Fixture data` / `Fixture validated` / `Harness-wired` are what stop the harness from looking finished
while being empty: a row can have fixture data present, never asserted, and not reachable by any test —
three distinct states that all feel like "we have fixtures".

## Build order

Part I first — it is the map, and it will change the order of everything below it. Then Part D is worth
having before any test exists, so:

**A** (clock) → **B** (fixture data) → **C** (season rebuild) → **D** (fixture server — browse it by hand,
answer the 500s question) → **E1** (route crawl) → **G** (loader tests + payloads) → **E2–E4** → **F**
(Storybook) → **H** (contracts).

## Scripts and CI

```
"dev:fixtures":  build + node harness/server.mjs          # browsable fixture site
"harness":       rebuild season + vitest run -c vitest.harness.config.ts
"test:e2e":      playwright test
"storybook":     storybook dev -p 6006
"test:stories":  vitest run --project=storybook
```

None of these need Java, an emulator, network access or secrets — so in `.github/workflows/build.yml`,
`test:stories` joins the existing `test` job, and `harness` + `test:e2e` become one job that builds once and
runs both. Keep `yarn test` on the pre-commit hook as-is.

## Verification

```bash
yarn dev:fixtures
```

Open `http://localhost:3100/?now=2025-01-20`, then `?now=2024-08-01`. Standings, teams and cup should be
populated at the first and empty at the second, from the same fixtures with only the clock different — that
is the whole harness proven in two page loads. Then:

```bash
yarn harness         # season rebuild + loader payload assertions
yarn test:e2e        # route crawl at three dates, date behaviour, actions, navigation
yarn test            # unchanged suite + new clock/gameweeks tests
yarn test:stories    # every page renders from real loader output, in a browser
yarn ratchet         # must not add type errors or CSS violations
yarn build           # the functions workspace is only type-checked here
```

Sanity checks worth doing by eye: `leagues.cup-league-gw21.json` has `currentGameweek: 21` while
`leagues.preseason.json` has `0`; and in `yarn dev:fixtures`, submitting a transfer then reloading shows it
as `PENDING` (proving the sheet store is genuinely stateful).

## Notes

- Branch and raise a PR; do not commit to master.
- `yarn build` before committing — `yarn test` and `yarn ratchet` never touch the `functions` workspace.
- New dependencies: `express` + `@react-router/express` (versions matched to `functions/package.json`),
  `storybook` ×3, `playwright`. Each needs a justification line in the PR description.
- **Done since approval:** the sheets fixtures now live in root `test-fixtures/spreadsheets/`, and the
  13 byte-identical duplicates that were spread across `cup/`, `draft/`, `points/`, `setup/` and
  `transfers/` subfolders are gone. `test-fixtures/fpl/` also holds synthesized element-summaries for
  the 12 rostered players who had no per-gameweek stats anywhere. See
  [test-fixtures/README.md](../test-fixtures/README.md) for what is real and what is invented.
- **Done since approval:** the 35MB of fixture JSON in the deployed server bundle is gone. The
  `?source=2425` player-page toggle was its only consumer and was showing two-season-old data, so it was
  removed; the raw captures now live in gitignored `archive/`. Server build 35MB → 1.0MB, 1318 chunks → 37.
- *[Separate problem found]* `division-teams` document ids are `${divisionId}_gw${gameweek}` with no season
  (`scoring/server/services/division-teams.service.ts:18`), so next season's points processing overwrites
  this season's documents in place. Not a blocker — the harness rebuilds from sheets — but it is why there
  was nothing left to capture.
