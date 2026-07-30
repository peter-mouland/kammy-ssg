# Testing Progress

Coverage tracked **per component, not per test framework.** The harness plan describes setup; this
describes what that setup has actually protected.

**This is not a steering file.** It is not loaded into every AI session. Read it when planning testing
work, not when doing unrelated work. It is the companion to [backlog.md](backlog.md) — same spirit, same
honesty rules.

**Update it in the same commit as the work.** A cell that says `●` when nothing runs is worse than no
document, because the next person believes it.

---

## How to read a row

| | meaning |
|---|---|
| `—` | **not needed.** The row says why in one clause. Never use this for "we gave up" |
| `○` | **gap.** Needed, absent. Every `○` is a task in the [gap register](#gap-register) |
| `◐` | **partial.** Real coverage with a named hole — the note says which |
| `●` | **covered** |
| `▲` | **blocked.** Needs something that does not exist yet (e.g. an RTDB emulator) |

**Columns**

| column | question | where it runs |
|---|---|---|
| `Unit` | is the logic right? | vitest, node, `yarn test` |
| `Data` | does the page get the right data on a given date? | vitest, real loaders + fixtures, `yarn harness` |
| `Render` | does the UI render this data, including empty and locked states? | Storybook in a browser, `yarn test:stories` |
| `Site` | does the whole thing work over HTTP with SSR and hydration? | Playwright vs the fixture server, `yarn test:e2e` |
| `Fix` | is there fixture data for it at all? | `test-fixtures/{spreadsheets,fpl}` — tracked; raw captures in gitignored `archive/` |
| `Val` | has anything asserted that fixture data is usable? | — |
| `Wired` | is it reachable by the harness today? | — |

The last three are separate on purpose. A row can have fixture data present, never asserted, and not
reachable by any test. All three feel like "we have fixtures" and none of them is coverage.

---

## Scoreboard

Baseline at the time of writing. These are the numbers that should move.

| group | rows | Unit | Data | Render | Site |
|---|---|---|---|---|---|
| Pages | 20 | n/a | **0/20** | 0/13 wanted | **0/20** |
| Data endpoints | 6 | n/a | **0/6** | n/a | **0/6** |
| Domain public APIs | 12 | 6/12 (5 partial) | 0/8 wanted | 0/5 wanted | n/a |
| Data readers | 15 | **2/15** | n/a | n/a | n/a |
| Shared components | 13 | n/a | n/a | **0/13** | n/a |
| Domain components | 86 files | 1/86 | n/a | 0/30 wanted | n/a |
| Pipelines | 5 | 2/5 | 0/5 | n/a | 0/3 wanted |

Raw file counts, for context on where the 38 existing test files sit:

| domain | lib | server | components | routes/pages |
|---|---|---|---|---|
| `cup` | **12/12** | 2/3 | 0/1 | 0/7 |
| `transfers` | 8/23 | 0/4 | 0/8 | 0/2 |
| `draft` | 4/7 | 0/2 | 0/9 | 0/1 |
| `scoring` | 2/7 | 1/5 | 0/4 | — |
| `teams` | 1/5 | 0/1 | 0/13 | 0/1 |
| `leagues` | 1/2 | 0/2 | 0/2 | 0/1 |
| `players` | 1/1 | 0/2 | 1/6 | 0/6 |
| `admin` | — | 0/6 | 0/24 | 0/10 |
| `wishlist` | 0/2 | — | 0/5 | 0/2 |
| `homepage` | — | — | — | 0/2 |
| `_shared` | 1/30 | — | 0/13 | — |

`cup/lib` at 12/12 against `cup` pages at 0/7 is the shape of the whole problem: the rules are proven, and
nothing proves a manager can use them.

---

## Pages

`Render` is only wanted where a page has states a server cannot cheaply produce. Everything else gets
`Data` + `Site`.

| Page | Responsible for | Unit | Data | Render | Site | Fix | Val | Wired |
|---|---|---|---|---|---|---|---|---|
| `/` | dashboard: all three division tables | — page | ○ | ○ | ○ | ● | ○ | ○ |
| `/leagues/:divisionId?` | standings, position rankings, time travel (**has action**) | — page | ○ | ○ | ○ | ● | ○ | ○ |
| `/teams/:userId?` | roster, pitch layout, gameweek nav | — page | ○ | ○ | ○ | ● | ○ | ○ |
| `/players` | player list, filters, stat columns | — page | ○ | ○ | ○ | ● | ○ | ○ |
| `/players/:playerCode` | player detail, per-gameweek history | — page | ○ | ○ | ○ | ● 12 synthesized | ● | ○ |
| `/transfers/:divisionId?` | transfer submission + validation (**has action**) | — page | ○ | ○ needed: open vs locked | ○ | ● | ○ | ○ |
| `/cup` | bracket, cup standings | — page | ◐ `cup.route.test.ts` | ○ | ○ | ○ **1 submission, empty bracket** | ○ | ◐ |
| `/cup/submit` | squad submission (**has action**) | — page | ○ | ○ needed: locked/revealed | ○ | ○ as above | ○ | ○ |
| `/cup/admin` | cup administration (**has action**) | — page | ○ | ○ | ○ | ○ as above | ○ | ○ |
| `/draft` | live draft room (**has action**) | — page | ○ | ○ | ▲ live sync needs RTDB | ◐ sheets yes, RTDB no | ○ | ○ |
| `/wishlists` | personal wishlist | — page | — localStorage only | ○ | ○ | — no server data | — | ○ |
| `/admin` (shell) | admin nav + the one loader/action all children share | — page | ○ ×3 paths | — | ○ | ● | ○ | ○ |
| `/admin` (overview) | system status, cache health | — page | ○ | ○ | ○ | ● | ○ | ○ |
| `/admin/draft` | draft management | — page | — parent loader | ○ | ○ | ● | ○ | ○ |
| `/admin/points` | points processing trigger | — page | — parent loader | ○ | ○ **must-have** | ● | ○ | ○ |
| `/admin/transfers` | transfer approval | — page | — parent loader | ○ | ○ **must-have** | ● | ○ | ○ |
| `/admin/settings` | admin settings | — page | — parent loader | ○ | ○ | ● | ○ | ○ |
| `/admin/setup-new-season` | season rollover checklist | — page | — parent loader | ○ | ○ | ● | ○ | ○ |
| `/admin-progress/:jobId` | long-running job progress | — page | ○ | — | ○ | — in-memory jobs | — | ○ |
| `/admin-progress-poll/:jobId` | job progress polling | — page | ○ | — | ○ | — as above | — | ○ |
| `/debug` | env/credential diagnostics | — page | — reads env only | — | ○ | — | — | ○ |

## Data endpoints

All six want `Data` (shape) and `Site` (status code + content type). None want `Render`.

| Endpoint | Responsible for | Unit | Data | Site | Fix | Val | Wired |
|---|---|---|---|---|---|---|---|
| `/players.json` | player list as JSON | — | ○ | ○ | ● | ○ | ○ |
| `/players/:playerCode.json` | player detail as JSON | — | ○ | ○ | ● | ● | ○ |
| `/scoring/api/gw-points` | gameweek points (**has action**) | — | ○ | ○ | ● | ○ | ○ |
| `/api/transfers/:divisionId` | fresh transfers for client polling | — | ○ | ○ | ● | ○ | ○ |
| `/api/cache` | cache management | — | ○ | ○ | ● | ○ | ○ |
| `/api/admin/draft-sync-comparisons` | sheets↔Firebase draft drift | — | ○ | ○ | ◐ RTDB side absent | ○ | ○ |

## Domain public APIs

A published contract. Every runtime export wants `Unit` **or** `Data` — never neither. Type-only exports
are excluded as untestable; the counts below are runtime exports.

| API | Exports | Responsible for | Unit | Data | Render | Notes |
|---|---|---|---|---|---|---|
| `scoring/index.ts` | 24 | the points engine: rules, formulas, breakdowns | ◐ 2/7 lib files | — | ○ 2 components | `calculations` + `utils` tested; `generators`, `data-conversion` not |
| `scoring/index.server.ts` | 10 | division-teams documents, points population | ◐ 1/10 | ○ | — | only `generatePlayerGameweekPointsTable` |
| `draft/index.ts` | 9 | snake order, pick calculator, eligibility | ◐ 8/9 | — | — | `toDraftStates` / `toDraftStateForDivision` untested |
| `draft/index.server.ts` | 1 | `FirebaseDraftSync` | ○ | — | — | ▲ needs RTDB to test properly |
| `teams/index.ts` | 6 | roster conversion, slot rules, sorting | ◐ 1/5 lib files | — | — | only `roster-conversion-utils` |
| `transfers/index.ts` | 4 | transfer integration into a gameweek doc | ○ | ○ | ○ `LoanStatusDisplay` | `applyTransfersToGameweekDocument` is untested and load-bearing |
| `transfers/index.server.ts` | 2 | reading + shaping division transfers | ◐ `transfer-rows.test.ts` | ○ | — | `getTransfersDataForDivision` untested |
| `leagues/index.ts` | 1 | `PositionPointsTable` | — component | — | ○ | |
| `leagues/index.server.ts` | 2 | standings, team of the week | ○ | ○ | — | both feed the homepage |
| `players/index.ts` | 1 | `buildPlayerStatsTsv` | ● | — | — | |
| `wishlist/index.ts` | 4 | wishlist state + UI | ○ | — | ○ 2 components | `useWishlists` untested |
| `admin/index.server.ts` | 1 | `handleCommitTeamsToFirestore` | ○ | ○ | — | the GW0 builder the harness depends on |

`cup/` and `homepage/` intentionally have no index: nothing outside them imports them, so there is no
contract to publish. Verified, not assumed.

## Data readers — the external boundary

Every reader wants `Unit` against fixture payloads through MSW, plus `Val` that its fixture is usable.

| Reader | Tab / endpoint | Unit | Fix | Val | Notes |
|---|---|---|---|---|---|
| `sheets/cup.ts` | `Cup` | ● | ○ | ○ | **1 submission in the fixture** |
| `sheets/cup.ts` | `CupConfig` | ● | ● | ○ | league 21,22,23 / r16 24,25 / … |
| `sheets/cup.ts` | `CupBracket` | ● | ○ | ○ | **header row only — empty** |
| `sheets/player-gw-points.ts` | `player-gw-points` | ● | ● | ○ | 605 players × 38 GWs |
| `sheets/transfers.ts` | `<division>-transfers` ×3 | ◐ parsing only | ● | ○ | 847 rows |
| `sheets/divisions.ts` | `Divisions` | ○ | ● | ○ | |
| `sheets/user-teams.ts` | `UserTeams` | ○ | ● | ○ | 24 managers |
| `sheets/draft.ts` | `Draft` | ○ | ● | ○ | 288 picks, joined by `code` |
| `sheets/draft.ts` | `DraftState` | ○ | ● | ○ | all three drafts complete |
| `sheets/draft-order.ts` | `DraftOrder` | ○ | ● | ○ | |
| `sheets/players.ts` | `Players` | ○ | ● | ○ | 572 rows, position overrides |
| `fpl/api.ts` | FPL HTTP client | ○ | ● | ○ | 2425 bootstrap, fixtures, 721 summaries |
| `fpl/api-cache.ts` | the public FPL interface + TTLs | ○ | ● | ○ | where the current gameweek is decided |
| `fpl/gameweeks.ts` | gameweek flags from dates | ○ | ● | ○ | the clock's main consumer |
| `fpl/fpl-firestore.ts` | FPL data in/out of Firestore | ○ | — derived | ○ | |

## Shared components

All 13 want `Render`: they are reused, so one break is many breaks. None has any test today.

| Component | Responsible for | Render | Notes |
|---|---|---|---|
| `table.tsx` | every data table on the site | ○ | highest reuse; sorting + empty state |
| `player.tsx` | player cards and rows in several shapes | ○ | 4 variants, all with FPL photo URLs |
| `gameweek-selector.tsx` | moving between gameweeks | ○ | date-dependent |
| `time-travel-banner.tsx` | "you are viewing a past gameweek" | ○ | date-dependent; Playwright asserts it too |
| `g-nav.tsx` | site navigation | ○ | |
| `select-division.tsx` | division picker | ○ | |
| `select-user.tsx` | manager picker | ○ | |
| `multi-select.tsx` | multi-value filter | ○ | interaction-heavy |
| `search-input.tsx` | text filter | ○ | |
| `page-header.tsx` | page title block | ○ | |
| `loading-overlay.tsx` | pending state | ○ | |
| `toast-manager.tsx` | transient messages | ○ | |
| `error-boundary.tsx` | the 500 page a user actually sees | ○ | **Playwright asserts its absence, so it must be right** |

## Domain components

86 files, 1 tested. Enumerating all of them would make this document unreadable, so per domain with the
highest-risk names called out. `Render` wanted = components with real state or conditional display, not
pure layout wrappers.

| Domain | Files | Render wanted | Highest risk |
|---|---|---|---|
| `admin` | 24 | 6 | `sections/*` — every destructive admin action lives here |
| `teams` | 13 | 6 | `football-pitch`, `position-slot-card`, `player-card`, `team-stats` |
| `draft` | 9 | 4 | `draft-board`, `draft-players`, `connection-status` |
| `transfers` | 8 | 5 | `transfer-form`, `player-in-selector`, `player-out-selector` (all date-dependent) |
| `players` | 6 | 3 | `player-gameweek-table` ● (the only tested component), `player-stats-table` |
| `wishlist` | 5 | 2 | `wishlist-form`, `wishlist-item` |
| `scoring` | 4 | 2 | `points-breakdown-tooltip` — a tooltip here once read "0 points" for every player |
| `leagues` | 2 | 1 | `position-points-table` |
| `cup` | 1 | 1 | `cup-fixtures` |

## Pipelines

The multi-step server flows. These are where a break is expensive and where nothing currently runs.

| Pipeline | Responsible for | Unit | Data | Site | Fix | Wired |
|---|---|---|---|---|---|---|
| Season rebuild (GW0 → GW38) | draft picks → rosters → points, per division | ○ | ○ | — | ● | ○ |
| Points processing | element stats → `POSITION_RULES` → division-teams | ◐ formulas only | ○ | ○ via `/admin/points` | ● | ○ |
| Transfer approval | `PENDING` → `APPROVED` → roster changes | ◐ validators ● 7/7, integration ○ | ○ | ○ via `/admin/transfers` | ● | ○ |
| Snake draft | order generation, pick advancement | ● 4/4 lib | ○ | ▲ RTDB | ◐ | ○ |
| Cup autopick + scoring | missed deadline → autopick → DQ at 2 | ● 12/12 lib | ○ | ○ | ○ empty fixtures | ○ |

---

## Gap register

Ordered by value, not by size. Each entry names the plan Part that unblocks it.

### Blocking everything

| id | task | Part |
|---|---|---|
| **G1** | Author cup fixture rows — 16 qualifiers across `league`/`r16`/`qf`/`sf`/`final`, plus a bracket. Without this the best-tested domain in the codebase has no integrated coverage and every cup page renders only its empty state | B |
| **G2** | Fixture server so any page can be loaded at any date | D |
| **G3** | Route crawl: 20 pages + 6 endpoints × 3 dates, asserting 200, no error boundary, no console error | E1 |
| **G4** | Loader payload tests + committed payloads, one per route | G |

### High value

| id | task | Part |
|---|---|---|
| **G5** | `applyTransfersToGameweekDocument` — a published export, load-bearing in the season rebuild, untested | G |
| **G6** | Playwright action specs: submit transfer → approve → roster changes; submit cup squad; process points | E3 |
| **G7** | `fpl/api-cache.ts` + `fpl/gameweeks.ts` unit tests — where the current gameweek is decided | A |
| **G8** | Unit tests for the 6 untested sheet readers (`Divisions`, `UserTeams`, `Draft`, `DraftState`, `DraftOrder`, `Players`) against fixture payloads via MSW | B |
| **G9** | `leagues/index.server.ts` — both exports feed the homepage, neither is tested | G |
| **G10** | Storybook for the 14 shared components, `table` and `player` first | F |
| **G11** | `scoring/index.server.ts` — 9 of 10 exports untested | G |

### Worth doing

| id | task | Part |
|---|---|---|
| **G12** | Date-behaviour Playwright specs: banner, transfer window, cup reveal, GW38 markers | E2 |
| **G13** | Storybook for the 30 domain components that carry state, `transfer-form` and `points-breakdown-tooltip` first | F |
| **G14** | `getTransfersDataForDivision`, `toDraftStates`, `useWishlists`, `handleCommitTeamsToFirestore` | G |
| **G15** | Navigation + hydration specs | E4 |
| **G16** | Live contract checks against real FPL and the real spreadsheet | H |
| **G17** | `Val` for every fixture: assert each tab parses through its real reader and yields the expected row count | B |
| **G20** | ~~Cover the defensive-contribution rule at the integration level~~ — **done**: the components are synthesized for every player, crossing the threshold in 49% of cb games, 11% of fb, 42% of mid. The rule is now reachable, at the cost of invented points in standings | B |

### Blocked

| id | task | blocked on |
|---|---|---|
| **G18** | `/draft` live sync, `FirebaseDraftSync`, draft drift comparison | an RTDB emulator (needs Java) or a second browser context |
| **G19** | Firestore serialization behaviour — `Timestamp.toDate()` at `fpl-firestore.ts:62-72`, `getAll` batch limits | the Firestore emulator (needs Java); `FIRESTORE_EMULATOR_HOST` works with no code change for anyone who installs it |

---

## Findings that shaped this document

Measured while building it, and each one changes what is worth doing:

- **The cup fixtures are effectively empty.** `Cup.json` holds one submission (Tim, championship, GW21,
  league leg 1); `CupBracket.json` is a header row. `cup/lib` has 12 test files and `cup/` pages have zero
  integrated coverage — G1 is the cheapest large win available.
- **Draft picks join by `code`, never by `id`.** All 288 rows carry `Code`, none carry `Player ID`. That is
  what makes a 2425 FPL pool usable with 2526 sheets.
- **`player-gw-points` in the 2526 folder is the 2024/25 table.** All 605 codes exist in the 2425
  bootstrap and none are 25/26-only; the sibling file is literally named `player-gw-points 24/25`. Good
  news for coherence — the points table and the 2425 element stats agree with each other. The only 25/26-era
  artifacts are the `Draft` and transfer tabs.
- **Twelve rostered players had no per-gameweek stats anywhere** — summer-2025 arrivals, absent from the
  2425 pool, absent from `player-gw-points`, and with empty `history` in the 2526 capture. **Now polyfilled**
  in `test-fixtures/fpl/` from their real 25/26 season totals in `FPL_Player_export`, ids 805–858. The
  totals are real; the per-gameweek distribution is deterministic fiction, marked `synthetic: true` on every
  row. Never verify a calculation against them.
- **`/players/:playerCode` degraded gracefully even before that.** `loadFixturesPlayerData` catches a
  missing file and returns `null`, so the page rendered empty stats rather than 500ing
  (`player.server.ts:88`). Worth knowing: a missing summary is not a page break.
- **The six `/admin` children having no loader is correct, and nothing needs doing.**
  `admin.route.tsx` already narrows per route — a lightweight branch for `/admin/setup-new-season` that
  skips FPL/Sheets/Firebase entirely, and `transfersData` loaded only on `/admin/transfers` — and children
  read it through `useOutletContext`. One data boundary for six pages, no duplication, no over-fetching.
  The only testing consequence: because the loader branches on `url.pathname`, its `Data` test must be
  parameterised by path (setup-new-season / transfers / everything else), which is why that row reads `○ ×3
  paths` rather than a single gap.
- **Fixed: the deployed server bundle was 35MB of fixture JSON.** The dynamic import in
  `players/server/player.server.ts` used a template literal, so Vite included every matching JSON in the
  server build — 1318 asset chunks, two 1.7MB `bootstrap-static` copies, ~1300 element-summary chunks —
  and `functions/build` shipped at 36MB. The `?source=2425` player-page toggle was the only consumer, and
  it was showing two-season-old data, so it was removed outright and the captures moved to gitignored
  `archive/`. **Server build: 35MB → 1.0MB, 1318 chunks → 37. `functions/build`: 36MB → 2.4MB.**
- **Only 262 of the 804 FPL players were ever rostered** — 125 drafted, 235 transferred in, with overlap.
  All 262 now resolve in the fixtures: 208 on real 2024/25 stats, 46 on real 2025/26 season totals, and 8 on
  a **stand-in season** — the median real season for their position, traceable via `standInFor`. The first
  pass synthesized only the 12 *drafted* players and missed 42 who arrived by transfer, several of whom
  played near-full seasons (Truffert 3378 minutes, Roefs 3150, Xhaka 2901). The 8 stand-ins were initially
  left on empty histories until it turned out 7 of them hold roster slots for months and 2 are still owned at
  GW38 — a false zero there understates a manager's total and looks like a scoring bug.
- **The four defensive stats are invented, for every player.** `clearances_blocks_interceptions`, `tackles`,
  `recoveries` and `defensive_contribution` are 2025/26 additions, absent from all 2024/25 history. No real
  source exists — FPL publishes no element-level total for the components (confirmed against all 88 columns
  of the raw `Player Export` tab), and the `FPL_Player_export` sheet's `defensive_contribution` column is 0
  for every player in every position. They are synthesized from position and minutes so that the
  defensive-contribution rule is reachable at all, since `calculations.ts:42` computes it from these fields.
  **Consequence: harness standings include invented points for every fb, cb and mid and are not a faithful
  replay of 2024/25** — assert behaviour and shape, never a specific total. Files carrying them are flagged
  `syntheticDefensiveStats: true`.
- **The 2024/25 data cannot be re-fetched.** FPL serves only the current season, so the archive is the
  only copy of 721 players' per-gameweek history. Gitignoring it is a deliberate trade: the harness reads a
  tracked 6MB slice in `test-fixtures/fpl/`, extracted before the raw data was untracked. See
  [archive/README.md](../archive/README.md).
- **Fixture layout, resolved.** Sheets fixtures moved to `test-fixtures/spreadsheets/` — nothing in the
  app imports them (verified: "Dave G", "Andy FC" and `spreadsheetKey` appear in 0 bundle chunks), so they
  are harness-owned by definition. 13 of the 31 files there were byte-identical duplicates across `cup/`,
  `draft/`, `points/`, `setup/` and `transfers/` subfolders; hash-verified and removed. The one genuinely
  distinct file, `player-gw-points 24/25.json`, is the 24/25 archive tab and was kept.
- **`_shared/lib` has two test files across 30 modules** — `sheets/player-gw-points.test.ts` and
  `cache/cache-invalidation.test.ts` (which covers `cache-config` + `data-cache` without a matching
  filename, so the 1/30 in the file-count table undercounts it). The steering only asks for cache logic and
  TTL config here, so most of that gap is legitimately `—` at the file level. The exceptions are the FPL
  modules in G7.
