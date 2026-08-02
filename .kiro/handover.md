# Handover — where things stand, 2026-08-01

Written for whoever picks this up next. **Not a steering file**: read it once at the start, then
work from the documents it points at.

---

## The one-paragraph version

The app was returning 500s and nobody could tell whether the code or the data was at fault. That is
now answered: an offline fixture harness (`yarn dev:fixtures`) runs the whole site from
`test-fixtures/` and renders every route, which proves the code path. Along the way the harness
found three real production bugs, all now fixed and deployed. **Production is live and error-free,
but its Firestore is empty**, so four pages show a "not loaded yet" explanation rather than data.
Filling it is the next job and it is an ops task, not a coding one.

## State

| | |
|---|---|
| branch | `master`, clean, everything merged ([PR #118](https://github.com/peter-mouland/kammy-ssg/pull/118)) |
| tests | 524 passing, 52 files |
| ratchet | types 174 · css 175 · biome 266 — all at baseline, types one *better* |
| production | https://draft-ff.web.app — deployed, 0 error pages |

Verify with `yarn test`, `yarn ratchet`, `yarn build`. Run `yarn build` before committing: it is the
only thing that type-checks the `functions` workspace.

## What exists now that did not before

- **`yarn dev:fixtures`** — the real app on port 3100, served entirely from `test-fixtures/`, no
  credentials, with the date as a URL parameter (`?now=2025-01-10`). Read *Running it locally* in
  [architecture.md](steering/architecture.md).
- **An in-memory Firestore** (`_shared/lib/firestore-cache/firestore-memory.ts`) behind
  `KAMMY_FIXTURE_FIRESTORE=1`. MSW cannot intercept gRPC and the emulator needs Java.
- **MSW handlers over the fixtures** for Sheets and FPL, with a **writable** sheet store so form
  actions can be exercised end to end.
- **A clock** (`_shared/lib/clock.ts`). Use `now()` rather than `new Date()` at any decision site.
- **A season rebuild** (`draft/harness/rebuild-season.ts`) — 117 documents through the app's own
  pipeline in about 7 seconds, and proven clock-independent.
- **Real error pages.** A failing loader now shows the whole cause chain and the specific error
  code; expected states ("the season has ended") render as explanations, not crashes.

## Do this next, in order

1. **Populate production Firestore.** All four collections are empty, which is why `/leagues`,
   `/teams`, `/transfers` and `/cup` return 503. Via `/admin`: populate bootstrap data → commit
   teams per division → run points processing. **Do the greatScott division too** — it has no
   `division-teams` documents at all, so its standings stay empty otherwise (G24).

   **2026-08-02 — still not done. "Populate Bootstrap Data" fails.** It returned a bare
   "Unexpected Server Error" page and wrote nothing (`players.json` still `[]`, checked past the
   CDN). The cause was invisible by design: React Router substitutes that placeholder for any
   unhandled server error, and `/admin`'s action read its form fields *outside* its own
   try/catch, so the throw escaped as an unhandled 500 rather than becoming action data.
   `requestFormData` indexed a load context that is `undefined` whenever Firebase does not parse
   the body. Fixed in [PR #120](https://github.com/peter-mouland/kammy-ssg/pull/120) —
   **retry the populate once that is merged and deployed**, and if it still fails the page will
   name the real cause instead of hiding it. Update this line when it succeeds.

   Ruled out while diagnosing, so nobody pays for it twice: the live data is fine (`Players`
   sheet 558 rows, FPL bootstrap 564 elements, **558 matched by code**), and it is not the 60s
   function timeout (element-summary fetches project to ~3s for all 558). `yarn dev:fixtures`
   runs the identical action end to end without error, which is what established that this was
   environment and not logic — the harness doing exactly the job it was built for.
2. **Part E1 of the plan — the Playwright route crawl.** Every route at three dates, asserting 200,
   no error boundary, no console error. This is the regression net the project still lacks, and the
   fixture server already makes it cheap. See [testing-harness-plan.md](testing-harness-plan.md).
3. **Then Part G** (loader payload tests) → **E2–E4** → **F** (Storybook) → **H** (contracts).

Smaller, self-contained items are in the [gap register](testing-progress.md#gap-register); **G25**
(untested admin orchestrator loop, untested `PositionPointsTable` prop) and **G1** (cup fixtures need
authoring, and need a human decision) are the live ones.

## Things that will cost you hours if you do not know them

- **`test-fixtures/spreadsheets/` is the only copy of the 2025/26 season.** The live sheet has rolled
  over. **Never run `fetch-season-fixtures.mjs 2526`** — it overwrites the fixtures with empty tabs.
- **`archive/` is gitignored and irreplaceable.** FPL serves only the current season.
- **Never assert exact points totals against fixtures.** The four defensive stats are invented for
  every player. Assert behaviour and shape.
- **The fixtures are a three-division season; the live sheet has four.** greatScott is code-covered
  but not fixture-covered.
- **The fixtures cannot reproduce pre-season, and production is in it.** Live FPL is on the
  2026/27 pre-season — 38 events, none `finished`, **no `is_current` at all** — so
  `getCurrentGameweekData()` returns undefined and every `.fplEvent.id` on it is a crash site.
  The captured 2024/25 bootstrap is a *finished* season whose frozen `is_current` (GW38) always
  rescues the fallback, so no `?now=` reaches that state. Part E1's `preseason` scenario
  (2024-08-01) yields a current **GW1** — it does not cover "no current gameweek anywhere".
- **What a division takes part in is data** — `promotion`/`relegation`/`cup` columns in the sheet.
  Never derive it from `order`; greatScott sorts last and is in none of them, so rank-based logic
  gets it exactly backwards.
- **`createAppError()` returns a plain object, not an `Error`.** It fails every `instanceof Error`
  check. This caused two separate bugs. `toErrorChain()` in `loader-error.ts` handles both shapes.
- **A 500 in the harness is not automatically an app bug.** Of the two `/players` crashes it found,
  one was app code and one was a missing step in the harness's own rebuild.
- **MSW answers a request whether or not it is authenticated.** The entire Sheets suite stayed green
  through a total auth outage. If you test a client, assert the auth header.
- **`yarn ratchet` fails when a count goes DOWN too.** Run `yarn ratchet:update`, commit `.ratchet.json`.
- **Never commit to master.** Branch, PR. Merging to master deploys to production.
- **Kill dev servers by `@react-router/dev`**, not `"react-router dev"` — that string does not appear
  in the process command line, so `pkill -f "react-router dev"` silently matches nothing.
