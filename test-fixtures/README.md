# test-fixtures

Everything the test harness reads, and **nothing the app imports** — so none of it is bundled or
deployed. That rule is load-bearing: it used to be broken, and it cost 35MB of every release.

```
test-fixtures/
├── spreadsheets/   18 Google Sheets tabs, as the API returns them   1.3MB
└── fpl/            one FPL pool: bootstrap, fixtures, 458 summaries  12MB
```

There are **no season folders**, deliberately. The data is a blend and no single season label was honest:
the league data is 2025/26, the per-gameweek stats are 2024/25, some season totals are 2025/26 spread
across a 2024/25 calendar, and the defensive stats never happened at all. Provenance is recorded per-file
and per-row instead — see *Provenance* below.

| | |
|---|---|
| `test-fixtures/` (here) | tracked. 13MB. |
| [`archive/`](../archive) | **gitignored.** The raw 57MB captures, some of it irreplaceable. Needed only to regenerate what is here. |

> **How the no-app-imports rule got broken, so nobody repeats it.** The captures used to live at
> `draft/app/api/fixtures/`, read at runtime by a `?source=2425` toggle on the player page. Because that
> import used a template literal, Vite bundled *every* matching JSON into the server build — 1318 asset
> chunks, 35MB, shipped to Cloud Functions on each deploy. Removing the toggle and moving the data out took
> the server build to **1.0MB / 37 chunks**.
>
> Fixture data does not go under `draft/app/`. If the app appears to need some, that is a data-loading
> problem, not a fixtures problem.

## `spreadsheets/` — the league data

The real 2025/26 season: **287 draft picks, 844 transfers, 24 managers** across three divisions. Each file
is exactly what the Sheets API returned (`{ range, majorDimension, values }`), so it can be served straight
through MSW.

**The live sheet no longer contains any of this.** The 2026/27 rollover cleared the transfer tabs,
`player-gw-points`, `Cup` and `CupBracket`, and replaced the draft. These files are the only copy.

**Filenames are lower-kebab-case; the sheet tabs are not.** The tabs use four naming styles (`UserTeams`,
`premierLeague-transfers`, `FPL Team Codes`, `FPL_Player_export`), so a reader resolving a tab to a file
needs this slug — and exactly this one, because the files were renamed with it:

```js
const slug = (tab) =>
    tab.replace(/([a-z0-9])([A-Z])/g, '$1-$2')  // camelCase: leagueOne -> league-One
       .replace(/[^a-zA-Z0-9]+/g, '-')           // spaces, underscores, slashes
       .replace(/^-|-$/g, '')
       .toLowerCase();
```

`player-gw-points 24/25` becomes `player-gw-points-24-25.json` — its tab name contains a slash, which is
why the capture script originally wrote it as a *directory*.

**Only 13 of the 18 tabs are read by app code**: `Divisions`, `UserTeams`, `Draft`, `DraftState`,
`DraftOrder`, `Players`, `Cup`, `CupConfig`, `CupBracket`, `player-gw-points`, and the three
`<division>-transfers`. The other five — `fpl-player-export`, `player-export`, `names-codes`,
`fpl-team-codes`, `player-gw-points-24-25` — are inputs to the regeneration scripts only. Note
`player-export.json` has an **empty row 0** with its headers in row 1, so a naive header parser breaks on
it.

Two things to know before trusting a number:

- **`player-gw-points.json` holds 2024/25 data**, not 2025/26 — all 604 codes exist in the 2024/25 pool and
  none are 25/26-only. That happens to make it consistent with the per-gameweek stats in `fpl/`. Cup
  scoring reads this tab and never recomputes.
- **`cup.json` has a single submission and `cup-bracket.json` is a header row.** Every cup page can only
  render its empty state until real rows are authored (G1 in
  [testing-progress.md](../.kiro/testing-progress.md)). The one submission's four players *are* present in
  `player-gw-points`, so scoring it works.

`players.json` is **cleaned, not raw** — see *Regenerating* below.

## `fpl/` — one element pool

| file | what |
|---|---|
| `bootstrap-static.json` | the real 2024/25 bootstrap: 804 elements, 20 teams, and the 38-event calendar the clock walks. Copied whole |
| `fixtures.json` | the real 2024/25 fixture list. Copied whole |
| `synthetic-elements.json` | 54 generated elements, ids 805–858, for rostered players the 2024/25 pool lacks |
| `element-summary/` | **458 files, ids 1–858** — 404 real, 54 synthetic |

One directory, one id space: synthetic ids start above 2024/25's maximum of 804, so there is nothing to
merge at read time. **`players.json` and `element-summary/` are 1:1** — 458 players, 458 files, no orphans
either way — so a missing summary is a real error, not a routine one.

## Provenance

Three tiers. All 262 players who were ever rostered resolve, and none scores a false zero.

| tier | count | what is real | flag |
|---|---|---|---|
| real per-gameweek history | 208 | everything except the four defensive stats | — |
| real season totals, invented distribution | 46 | the season aggregate, exactly | `synthetic: true` |
| stand-in season | 8 | nothing — a named donor's real season | `standInFor: <id>` |

Beyond the 262 rostered, another 196 players carry real 2024/25 history so that any player on `/players`
opens a real page.

**Tier 2 — 46 players** who joined the Premier League in summer 2025, so they are in the sheets but not the
2024/25 pool. 12 were drafted; **42 arrived by transfer**, several playing near-full seasons (Truffert 3378
minutes, Roefs 3150, Xhaka 2901), so zeros would have visibly distorted standings. Their 2025/26 season
totals from `FPL_Player_export` are preserved exactly; *which gameweek* each goal landed in is
deterministic fiction. Opponents come from the real 2024/25 fixture list for their club.

**Tier 3 — 8 players** in the gap between both captures: not in the Premier League in 2024/25 (Palhinha at
Bayern, Douglas Luiz at Juventus, Chukwueze at Milan, Cullen and Flemming in the Championship) and gone
before the 26/27 export. No aggregate exists, not even a season total. They still hold roster slots for
months — Palhinha across 4 managers and 3 divisions, and **Palhinha and Diouf are owned at GW38** — so each
gets the **median real 2024/25 season for their position** among 1500+ minute regulars:

| player | donor | season |
|---|---|---|
| Palhinha, Cullen, Douglas Luiz | element 64 (mid) | 36 apps, 2976 mins, 82 pts |
| A.Jimenez, Diouf | element 98 (fb) | 38 apps, 3092 mins, 94 pts |
| Kolo Muani, Flemming | element 617 (ca) | 31 apps, 2317 mins, 128 pts |
| Chukwueze | element 9 (wa) | 33 apps, 2284 mins, 125 pts |

Three donors are shared by two stand-ins each, so those pairs carry identical underlying stats.

> ### The four defensive stats are invented, for every player
>
> `clearances_blocks_interceptions`, `tackles`, `recoveries` and `defensive_contribution` are 2025/26
> additions, absent from every 2024/25 history row. They are synthesized by
> [`scripts/lib/synthetic-defensive-stats.mjs`](../scripts/lib/synthetic-defensive-stats.mjs) from position
> and minutes, with **no real aggregate behind them** — FPL publishes no element-level total for the
> components (confirmed against all 88 columns of the raw `Player Export` tab), and the
> `FPL_Player_export` sheet's `defensive_contribution` column is 0 for every player in every position.
>
> Why: `POSITION_RULES` awards defensive-contribution points (1pt for fb/cb at 10+ CBIT, 2pts for mid at
> 12+ CBIRT) and `calculations.ts:42` computes them from these fields, deliberately ignoring FPL's own
> aggregate because it bakes in FPL's position. With zeros, nothing could reach the rule.
>
> The cost: **every fb, cb and mid earns invented defensive points, so harness standings are not a faithful
> replay of 2024/25.** Assert behaviour and shape, never a specific total.
> `scoring/lib/calculations.test.ts` proves the maths against known inputs. Every file carrying them is
> flagged `syntheticDefensiveStats: true`.
>
> Rates land where you would expect over 60+ minute appearances: cb mean 9.6 CBIT crossing the bar in 49%
> of games, fb 7.3 / 11%, mid 11.0 CBIRT / 42%, and gk/wa/ca never — matching the positions with no rule.

## Regenerating

Needs [`archive/`](../archive) present locally. **Order matters** — the synthesizer reads the extracted
slice to pick its donors, and the cleaner needs both to know which players have summaries:

```bash
node scripts/extract-harness-stats.mjs       # archive -> fpl/            40MB -> 6MB
node scripts/synthesize-missing-players.mjs  # the 54 without 2024/25 stats
node scripts/clean-fixture-players.mjs       # prunes + repairs players.json
```

All three are byte-stable and idempotent, so a clean regeneration produces no diff. None runs in CI.

**What the cleaner does, and why `players.json` is not the raw capture.** The captured sheet had two defects
that made the fixture unusable:

- **150 rows had `#N/A (Did not find value ...)` in `isHidden`.** `generators.ts` does
  `Boolean(playerSheet.isHidden)`, and a non-empty `#N/A` string is truthy, so those players were marked
  hidden and filtered out of the transfer picker. Every value in the column was either `#N/A` or empty — no
  player was legitimately flagged — so blanking restores intent. 354 `#N/A` cells were blanked in total
  (`isHidden`, `club_shortcode`, `status`) and 3 `web_name` values refilled from the real bootstrap. For
  reference the live sheet is clean (554 empty, 4 real `hidden`), so this was a capture defect, not a
  production bug.
- **114 rows had no element-summary and were never rostered.** Removed, taking the sheet from 572 to 458.
  Anything rostered is kept regardless of missing stats.
