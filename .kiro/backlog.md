# Codebase Improvement Backlog

A living plan to make this codebase safe for non-engineers and AI assistants to contribute to.

**This is not a steering file.** It is not loaded into every AI session. Read it when planning work, not when doing it.

---

## Start here (new session)

**What this is:** a plan to make this codebase safe for non-engineers and AI assistants to contribute to. Phases 0 and 1 are largely done; Phase 2 (the DDD work) is mid-flight.

**Check where things stand — three commands, thirty seconds:**

```bash
yarn ratchet   # types / css / lint backlogs. These may only go DOWN.
yarn test      # the suite, including the executable architecture rules
git log --oneline -15
```

**The three things that will bite you if nobody tells you:**

1. **`yarn ratchet` fails when a count goes DOWN, not just up.** That is deliberate — it makes you run `yarn ratchet:update` and commit the lower number, so a win is locked in rather than leaving room for a new problem.
2. **`architecture.test.ts` allowlists are debt registers, not config.** Every one has a paired "no stale entries" test: fix a violation and the suite *fails* until you delete its line. Never add an entry without recording why in the decisions log below.
3. **Commit before any scripted mass edit.** A migration script silently corrupted 11 files once; the clean revert was only possible because of an existing commit.

**Next up**, in the order I would take them:

| | Why |
|---|---|
| **P2.6 — decide the last 6 cycles** | The only Phase 2 item left. Down from 15. P2.1–P2.7 have taken every cycle a *move* can take; what is left is a modelling question, which is what P2.6 always said it would be. |


*Recently done: P2.7 (every domain has a public API; all three architecture allowlists are now empty), P2.5 (`MAY_REACH_INSIDE` 21 → 9; cycles 10 → 6), P2.1b (the data kernel — `_shared` now imports no domain at all), P2.5 for `gameweek-selector` (`MAY_REACH_INSIDE` 21 → 17), P4.5 (steering realigned + drift check), P3.3 (draft/lib now has 47 tests), P2.7 for `draft` (first public API), P2.3 (every sheets reader is now domain-free).*

**Working agreements that are not obvious from the code:**
- Consumer-focused tests that survive refactoring come **before** the refactor they protect. We violated this early and it cost us.
- Look for one root cause before grinding a list. Six times now, a domain's errors turned out to be one missing type or one name doing two jobs.
- When a plan meets reality and loses, **replan in writing** — P2.3 has been rewritten twice and P2.4's premise was wrong. Both are recorded, with the reasoning.

---

## How to use this document

- Work top-down. Phases are ordered by dependency, not by preference.
- Tick items as they land: `- [ ]` → `- [x]`, and add the PR/commit ref.
- When you find a new issue mid-task, **do not fix it** — add it to [Found along the way](#found-along-the-way) and carry on. That is the `[Separate problem found]` rule from [ai-contribution-rules.md](steering/ai-contribution-rules.md) applied to this document.
- Every item has an **acceptance criteria** line. If you cannot tick that line honestly, the item is not done.

### Status legend

| Marker | Meaning |
|---|---|
| `- [ ]` | Not started |
| `- [~]` | In progress |
| `- [x]` | Done — acceptance criteria met |
| `- [!]` | Blocked — reason noted inline |

---

## Guiding principles for this work

These are the decisions that shape every item below. Agreed 2026-07-26.

**1. Enforcement over documentation.**
Every rule we want contributors and AI to follow must be a check that fails, not a paragraph they might read. Markdown rules degrade silently; tests do not. If we write a new rule, we write the check with it.

**2. Tests first, and consumer-based.**
Before changing behaviour, write an integration-style test that exercises the real thing through its public boundary. The test must be written so that it still passes after the refactor it is protecting — it asserts *what the system does*, never *how it is wired*. No mocks (see [testing-conventions.md](steering/testing-conventions.md)).

**3. Long-term correctness over short-term smallness.**
Contributors will be short-term; we are the architecture guardians. When a fix has a cheap version and a correct version, we take the correct version. This is the one place we deliberately override "make the smallest change" — that rule governs *feature* work, not the structural work in this document.

**4. `cup/` is the reference implementation.**
Newest domain, 12 test files, zero type errors. When in doubt about how something should look, copy `cup/`.

---

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-26 | Type-error **ratchet** rather than a big-bang fix | 275 errors cannot be fixed before work resumes; a ratchet stops it getting worse from day one while we burn down at our own pace |
| 2026-07-26 | Do Phase 2 (sheets → domain move) despite its size | It is the correct fix for the dependency inversion *and* it is what unblocks route-loader testing. Deferring it defers the test strategy. |
| 2026-07-26 | Route convention: **route file owns loader/action, `.page.tsx` owns UI** | Matches `cup/` and the majority of newer code |
| 2026-07-26 | Shared *kernel* is a legitimate concept and gets a home in `_shared/types/` | "Types live in the domain that owns the concept" has no answer for concepts the whole league owns, which is how `DivisionId` ended up in `teams/` |
| 2026-07-26 | Revive **stylelint** rather than delete it; Biome has not replaced it | Biome formats CSS but enforces none of `css-conventions.md` — a probe file breaking six documented rules at once passed `biome lint` clean |
| 2026-07-26 | Keep `stylelint-config-standard` rather than hand-enumerating rules | Its "noise" was a one-time `--fix` (1228 → 550, no judgement needed), and it caught the best bug of the exercise (`media-query-no-invalid`) which a hand-written list missed. Verified it does not fight Biome: count unchanged after `biome format --write`. |
| 2026-07-26 | Override `media-feature-range-notation` to `"prefix"` | Its autofix rewrote 75 media queries to `(width <= 768px)`, which silently defeated the mobile-first check (63 violations → 5). The one genuine Biome/stylelint-adjacent conflict. |
| 2026-07-26 | One shared **ratchet** mechanism for both type errors and CSS | Same mental model for both backlogs, one script, one baseline file (`.ratchet.json`) |
| 2026-07-26 | **Each domain gets a public API (`index.ts`); `server/` and `components/` become private** | Three items stalled because `admin` orchestrates other domains — its actual job — with no legal way to reach their logic, which is why 10 `admin -> X/server` entries sit allowlisted. An index lets a domain expose an operation without exposing everything behind it. Chosen over exempting `admin` from Rule 2, which would have been the same debt without admitting it. |
| 2026-07-26 | **Sheets access is a cross-cutting concern. Every sheet reader lives in `_shared/lib/sheets/`, with no exceptions** | One spreadsheet, one client, one auth, one cache strategy — it is the app's persistence layer. Splitting a reader out because of who happens to read it today is arbitrary and reverses the moment a second domain needs that data. An exception costs every future contributor the question "where do we read sheets?" |
| 2026-07-28 | **MSW is the standard for anything crossing the network; it is not a "mock"** | `testing-conventions.md` banned mocks and named injecting a fake Sheets client as the alternative, which read as ruling MSW out. That conflated two different things. Replacing a *module* is a fiction about how the code is assembled and goes stale on any refactor. Replacing a *network response* is not — the network is a boundary the app genuinely crosses. MSW intercepts there, so the real FPL client, the real `googleapis` client, its auth and its parsing all still run. That is **more** real coverage than a fake client, which only proves the interpretation code works when handed a perfect object. Rule reworded to "no module mocks — substitute at a real boundary". |
| 2026-07-28 | **A domain gets TWO public entry points: `index.ts` (client-safe) and `index.server.ts`** | Found doing P2.7 for `draft`. `FirebaseDraftSync` reaches `firebase.realtime-admin`, which parses a service account from `process.env` **at module scope**. Re-exporting it from `index.ts` would make the entire public API unsafe to import from a component, and the failure mode is `process is not defined` in the browser rather than a build error. A single barrel per domain would have quietly forced every domain's public API to be server-only. Verified both ways with throwaway probes: `index.ts` imports clean with no credentials, `index.server.ts` throws. |

---

## Baseline

Re-measure with `yarn ratchet` and `yarn test`. Committed counts live in `.ratchet.json`.

| Metric | At start (2026-07-26) | Now |
|---|---|---|
| Type errors | 275 | **176** |
| CSS convention violations | not measurable (stylelint not installed) | **175** — `color-no-hex` cleared |
| Biome lint warnings | 280, none enforced | **266**, ratcheted |
| Tests | 149 passing, 24 files | **342 passing, 37 files** |
| CI type check | `continue-on-error: true` — cannot fail a PR | ratcheted, blocking |
| `functions/` type errors | unmeasured — only `yarn build` saw them | **0**, ratcheted and must stay there |
| Root `yarn type-check` | fails: `command not found: tsc` | works |
| Pre-commit hook | never ran (see P0.6) | runs lint-staged + tests |
| `_shared` → domain imports | 34, across 6 domains | **0** — P2.1 + P2.4 + P2.7 (draft) + P2.3 + P2.1b complete. The allowlist is empty. |
| Domain → another domain's internals | 34 | **0** — P2.7 twenty-two, P2.5 twelve. The allowlist is empty. |
| Architecture rules enforced | 0 | **5** (P1.2, P4.5) — and all three of their allowlists are now empty (P2.1b, P2.5, P2.7) |
| Domain dependency cycles | 15 | **6** — P2.4 two, P2.7 (draft) one, P2.3 two, P2.1b two, P2.5 two |

### Type errors by domain

```
transfers  41     scoring    15     players     9
admin      32     draft      12     api         7
teams      28     leagues    10     cup         0  ← the target
_shared    21                       wishlist    0
```
*Re-measure with `yarn ratchet`. `players` dropped 31 → 9 when `TableColumn.title` was declared.*

### CSS violations by rule

```
360  color-no-hex                        14  no-duplicate-selectors
 78  selector-max-type                   14  declaration-no-important
 63  media-feature-name-disallowed-list   6  selector-max-compound-selectors
 32  transition: all (disallowed-list)    1  property-no-deprecated
 19  no-descending-specificity            1  declaration-block-no-duplicate-properties
 14  keyframes-name-pattern               1  declaration-property-value-keyword-no-deprecated
```

---

## Phase 0 — Stop the bleeding ✅ complete

- [x] **P0.1 — Gitignore the leaked Firebase service account key**
  `draft/draft-ff-firebase-adminsdk-fbsvc-d354f21c6b.json` was untracked but **not** gitignored. One `git add .` from being committed.
  *Done:* `.gitignore` now covers `*adminsdk*.json`, `*service-account*.json`, `*serviceAccount*.json`; `git check-ignore` confirms the match.
  **⚠️ Still outstanding, manual:** rotate that key in the Firebase console. It has sat unignored in a working tree — treat it as exposed.

- [x] **P0.2 — Fix `invalidatePattern`, test first**
  `invalidatePattern` matched with a literal `key.includes(pattern)`, so `*` was matched as a literal character — while a *correct* matcher (`matchesPattern`) already sat 100 lines below it, used by a near-duplicate `deletePattern`.
  **Impact was narrower than first reported.** `CACHE_KEYS.SCORING.DIVISION_TEAMS` was never used to cache anything (division teams read straight from Firestore), so there was no 24h stale-points bug. The genuinely broken path was `FPL_DATA_UPDATED`: its prefix entry `'fpl:player-stats:'` went to `invalidateMultiple`, which only deleted exact keys, so every per-player stats cache (24h TTL) survived an admin FPL refresh.
  *Done:* one pattern matcher, anchored at the start of the key; `invalidateMultiple` routes through it so rules can carry prefixes; duplicate `deletePattern` removed; the orchestrator's hand-written `'transfers:*'` / `'draft:*'` / `'gameweek:*'` / `'scoring:*'` strings (which matched nothing) replaced with declared rules. 19 tests in [cache-invalidation.test.ts](../draft/app/_shared/lib/cache/cache-invalidation.test.ts), written failing first.

- [x] **P0.3 — Route all invalidation through declared rules**
  Four rules were declared and never called while real invalidation happened via ad-hoc `dataCache.invalidate(...)` elsewhere — two competing patterns, with the steering docs describing the unused one.
  *Done:* every ad-hoc call site converted to `getInvalidationKeys(...)`; `TRANSFERS_PROCESSED` and `SCORING.DIVISION_TEAMS` deleted as unused scaffolding for a cache that does not exist; `CUP_BRACKET_UPDATED` added; undeclared magic keys `'fpl:cache-health'` and `'fpl:teams-by-code'` declared and added to `FPL_DATA_UPDATED` (the latter previously survived every FPL refresh); `getInvalidationKeys` given a real generic signature so a call site cannot name a missing rule or forget a `divisionId`. Two tests assert every declared rule has a caller and every called rule is declared.

- [x] **P0.4 — Fix the broken root scripts**
  *Done:* `yarn type-check` now delegates to `yarn workspace draft typecheck` (root had no `tsc`); duplicate `typecheck` removed; `biome:all` missing `yarn` fixed; dead `"--lint"` eslint script removed.

- [x] **P0.5 — Remove genuinely dead config, revive stylelint**
  Original plan was to delete all seven config files. **That was wrong for stylelint** — see the decisions log.
  *Deleted (verified dead — not installed, not in `yarn.lock`, nothing invokes them):* `.eslintrc.json`, `.eslintrc-new.json`, `.eslintignore` (its preset `@kammy/eslint-config/react` was not installed either, so it could not even resolve), `.prettierrc`, `.prettierignore` (prettier exists only as a transitive dep of `@react-router/dev`), `lerna.json`.
  *Revived:* `.stylelintrc`. Biome formats CSS but enforces **none** of `css-conventions.md` — a probe file breaking six documented rules passed `biome lint` clean. stylelint 17.14.1 + stylelint-config-standard 40.0.0 installed pinned, config translates the conventions doc into rules with contributor-readable failure messages.
  678 stylistic problems auto-fixed; 603 remain, ratcheted.

- [x] **P0.6 — Restore the pre-commit hook (found during P0.5)**
  The hook had **never run**: `core.hooksPath` was unset, husky was not installed, `.husky/_/` did not exist, and the script called `yarn run check:up-to-date-types` — a script that exists nowhere. `.lintstagedrc.json` configured Biome but lint-staged was not installed and was never invoked. So `ai-contribution-rules.md`'s claim *"The pre-commit hook runs Biome automatically"* was false.
  *Done:* husky 9.1.7 + lint-staged 17.2.0 installed pinned; `prepare` updated to husky v9 syntax; hook runs `lint-staged` (Biome + stylelint `--fix` on staged files) then `yarn test` (~4s). Verified end to end.

- [x] **P0.7 — Fix 5 media queries that never matched (found by stylelint)**
  `@media (max-width: var(--breakpoint-md))` — custom properties are not valid in media query conditions, so those blocks never applied. Responsive styles were silently dead on the transfers pages: [loan-info-panel](../draft/app/transfers/components/loan-info-panel.module.css), [loan-status-display](../draft/app/transfers/components/loan-status-display.module.css) ×3, [transfer-form](../draft/app/transfers/components/transfer-form.module.css).
  *Done:* replaced with literal px matching the token values. They remain `max-width`, so they stay in the 63-strong mobile-first backlog — converting them to `min-width` means inverting the rules inside, which is a real refactor, not a bug fix.

---

## Phase 1 — Turn the safety net back on

The highest-leverage phase. Nothing after this is safe without it.

- [x] **P1.1 — Ratchet in CI**
  *Done:* [scripts/ratchet.mjs](../scripts/ratchet.mjs) with counts committed in `.ratchet.json`. Covers **both** type errors and CSS violations through one mechanism. `continue-on-error: true` removed from [build.yml](../.github/workflows/build.yml); CI now runs `yarn ratchet` as a blocking step.
  Fails if a count goes up; also fails (helpfully) if a count goes *down*, telling you to run `yarn ratchet:update` and commit the lower number, so wins get locked in.
  Verified both directions: passes at baseline, and a deliberately-added `!important` was caught.
  *Note:* counts are repo-wide, not per-domain. Per-domain granularity for types can be added when P1.3 makes it useful.

- [x] **P1.2 — `architecture.test.ts` — make the steering rules executable**
  *Done:* [architecture.test.ts](../draft/app/architecture.test.ts), 8 tests, no new dependency. (Now 10 — P4.5 added the route-table drift check as Rule 5.) Walks every relative import in `app/` (including dynamic `import()`) and enforces four rules:

  | Rule | Current debt |
  |---|---|
  | `_shared/` may not import from a domain | **34** allowlisted |
  | A domain may only use another domain's `types/` and `lib/` | **34** allowlisted |
  | No new circular dependencies between domains | **15** pairs, capped |
  | No exported type name declared in two files | **0** — fully enforcing since P1.3b |

  Two design choices worth keeping:
  - **Every allowlist has a paired "no stale entries" test.** When a Phase 2 item lands, the corresponding line *must* be deleted or the suite fails. The allowlist cannot quietly become permanent.
  - **The cycle count fails if it goes *down* too**, telling you to lower `KNOWN_CYCLIC_PAIRS`. Same ratchet mentality as `.ratchet.json`.

  Failure messages name the file, the rule, and what to do about it. Verified in both directions: a probe import into `_shared/` was caught, and a fake allowlist entry was reported as stale.
  *Still to add after P4.1:* every `*.route.tsx` has a sibling `*.page.tsx`.

  **The two allowlists are now the Phase 2 worklist.** Note how concentrated they are — `players/components/player` (8 importers), `scoring/server/services/division-teams.service` (6) and `teams/components/gameweek-selector` (4) account for 18 of the 34 internal-reach violations.

- [ ] **P1.3 — Burn down type errors, one PR per domain, ascending cost**
  Order: `leagues` (10) → `api` (7) + `wishlist` (1) → `scoring` (15) → `_shared` (26) → `teams` (30) → `players` (34) → `draft` (36) → `transfers` (51) → `admin` (63).
  *Acceptance:* baseline reaches 0 for each domain as its PR lands.

  - [x] **P1.3a — Restore the missing `draft-types` exports**
    [draft-types.ts](../draft/app/draft/types/draft-types.ts) exported 6 types while 12 files across `draft/`, `admin/` and `_shared/` imported 8 that did not exist. Those files were running on implicit `any`.
    *Done:* **273 → 242 errors**; every `TS2305 (has no exported member)` gone; `draft` 36 → 12, `admin` 63 → 58, `_shared` 26 → 22. Shapes were inferred from the code that builds each value — sheet headers for `DraftOrderData`, the loader's return for `DraftLoaderData`, `makeDraftPick`'s result for `DraftActionData` — not guessed.

    **`PositionCounts` and `TeamCounts` turned out to be two different concepts sharing one name**: a manager's drafted squad in `draft-rules.ts`, versus how many players are available and eligible per position in `draft-filters.tsx`. No single type could serve both, which is part of why the exports were lost. Split into `PositionCounts`/`TeamCounts` (squad) and `PositionAvailabilityCounts`/`TeamAvailabilityCounts` (filters), each commented with the distinction.

    Also collapsed a duplicate: `admin/components/ui/draft-card.tsx` declared its own local `DraftAction` listing only 4 of the 6 real actions — it now imports the canonical one.

  - [x] **P1.3b — De-duplicate colliding type names**
    *Done:* **242 → 240**; `transfers.server.ts` and `transfers.page.tsx` went from 10 errors to 0, and no self-referential `Type 'X' is not assignable to type 'X'` error remains anywhere.
    `TransferFormData` was declared **twice in the same file** (`transfer-form-types.ts` lines 31 and 136); TypeScript's declaration merging combined them silently and the second was a strict subset, so it was invisible dead weight. Deleted.
    `TransferValidationResult` was two genuinely different concepts — the rules engine's admin-facing result (`transfer-rule-types.ts`) versus the form's live display state (`transfer-form-types.ts`), with `warnings` typed `RuleValidationResult[]` in one and `string[]` in the other. The form's is now `TransferFormValidation`; `TransfersPageData.currentTransfers[].validation` points at the rules-engine type, which is what the server always produced.
    The `architecture.test.ts` stale-entry check then failed and forced `DUPLICATE_TYPE_NAMES` to be emptied — so duplicate type names are now permanently blocked.

  - [x] **P1.3c — Two shared root causes across five domains**
    Investigated instead of grinding domain-by-domain, because the same two errors repeated everywhere. **240 → 224**; every domain improved, `wishlist` reached 0.

    **`EnhancedPlayerData & RosterPlayer` (10 sites, 5 domains).** `PlayerSummary`/`PlayerLayout` in [player.tsx](../draft/app/players/components/player.tsx) demanded a value that was *both* an FPL player and a roster player — which no caller could ever produce, hence the casts. But the component body reads every field with a fallback (`playerCode || code`, `playerName || web_name`, `playerPosition || draft.position`), so it always meant **either**. Replaced with `DisplayablePlayer` in [player-types.ts](../draft/app/players/types/player-types.ts): one shape required, the other's fields optional.

    **`Property 'eligibility' does not exist` (4 sites).** [player-in-selector.tsx](../draft/app/transfers/components/player-in-selector.tsx) decorates each player with `eligibility` and `ownership`, then typed its table columns as bare `EnhancedPlayerData`, discarding the decoration. Added `SelectablePlayer` and `PlayerOwnership`, and made `getTransferSelectorStatColumns` generic over `T extends EnhancedPlayerData` so the shared stat columns work for both.

    **A latent React crash, exposed by the honest union.** With `team_code` correctly optional, `teamsByCode[player.team_code].name || teamsByCode[player.team_code]` stopped type-checking. Two real defects: an unguarded index that throws when a club is missing, and a fallback that renders an entire `FplTeam` **object** as a React child ("Objects are not valid as a React child"). Replaced both copies with a guarded module-scope `resolveTeamName` helper, per the pure-helpers-outside-components rule.


  - [x] **P1.3d — Six root causes in `admin`**
    `admin` had barely moved through P1.3a–c, so it was investigated rather than ground through. **224 → 200; admin 56 → 32**, and it is no longer the largest domain.

    | Cause | Errors |
    |---|---|
    | `AdminActionData` used 8 times in `admin.route.tsx`, never declared anywhere | 8 |
    | `DraftStatusData` imported by 3 files, never declared (TS suggested `DraftStateData`) | 3 |
    | `data()` returns `DataWithResponseInit<T>`, but the action was annotated `Promise<AdminActionData>` | 6 |
    | `StatusCardProps.children` / `ActionBarProps.children` required, but no caller passes them | 7 |
    | `SystemHealthStatus` covering two different concepts | 3 |
    | Error paths returning incomplete status objects | 2 |

    **`SystemHealthStatus` was the `PositionCounts` pattern again.** Firebase and Sheets checks return `{status, message}` — a connection check. But `fplCache` was assigned `getCacheHealth()`, which returns `{status, data: {completionPercentage, counts, missing}}` — a cache-completeness report with no `message` at all. Split into `SystemHealthStatus` and `FplCacheHealth`; `determineOverallHealth` now takes only `{status}`, which is all it ever read.

    **Two error paths were returning objects missing most of their fields** — `getDraftStatusReal`'s catch omitted `stage`, `isComplete`, `totalPicks` and three more. Consumers read `draftStatus.stage`, so on failure they compared against `undefined` and silently produced no recommendations. Replaced with named `DRAFT_STATUS_UNKNOWN` / `FPL_CACHE_HEALTH_UNKNOWN` constants, and added an explicit `'unknown'` to `DraftStage` — defaulting a failure to `'order'` would have told an admin to regenerate a draft order that already exists.

    **Ownership fix:** `DraftDivisionStatus` and `DraftStatusByDivisionId` were declared in `admin/types/` despite being draft concepts. Moved to `draft/types/` alongside the new `DraftStatusData`, so admin consumes them rather than owning them.

---

## Phase 2 — Fix the dependency inversion

The real DDD work. Large, but correct — and it is what unblocks route-loader testing.

**Write the characterisation tests first.** Before moving anything, each affected loader needs a consumer-based test asserting the data it returns for a given URL and division. Those tests are the proof the refactor changed nothing.

- [x] **P2.1 — Name the shared kernel**
  *Done:* [_shared/types/league-types.ts](../draft/app/_shared/types/league-types.ts). Seven types moved out of `teams/` and `players/`: `DivisionId`, `ManagerId`, `DivisionSheetData`, `UserTeamsSheetData`, `CustomPosition`, `RosterPosition`, `PositionSlotKey`. 88 files rewritten.

  **`_shared` → domain imports: 34 → 17.** Exactly half, from one change. `DivisionId` alone accounted for 7 of them — the most fundamental concept in the app was living in a feature domain, so `_shared` had to reach into `teams` to say anything at all.

  Scoped deliberately to the *identity* kernel: every type moved is a string union or a plain record with no dependency on domain logic. `RosterPlayer`, `TeamRoster`, `Points` and `EnhancedPlayerData` are left for **P2.1b** — they drag a dependency chain behind them and deserve their own reviewable change.

  The file carries a warning that it is a shared kernel and not a second dumping ground, and that additions need a note here. That is the failure mode we are moving away from, not toward.

  *Verification:* type errors unchanged at exactly **200** before and after — the correct result for a type-only move, since none of it survives compilation. 176 tests pass, no new lint warnings.

  *Note:* the first attempt was reverted. The migration script located the insertion point by finding where the import block *ended*, which a trailing `// comment` after an import defeats — it silently inserted an import mid-interface in 11 files. Redone anchoring on the *first* import instead. The pre-existing commit made the revert clean; this is a good argument for committing before any scripted mass edit.

  **The remaining 17 entries now map cleanly onto the rest of Phase 2:**

  | Cleared by | Entries |
  |---|---|
  | P2.3 — move sheets modules into their domains | 9 |
  | P2.4 — move domain logic out of `_shared/lib` | 5 |
  | P2.1b — `EnhancedPlayerData` into the kernel | 3 |

- [x] **P2.1b — Move the data kernel**
  *Done:* **`SHARED_MAY_IMPORT` is now empty — `_shared` imports no feature domain at all.** That metric started at 34. **Two more cycles dissolved, 10 → 8.**

  **The data kernel is three files, not one**, because these are three concepts and collapsing them hides that:

  | File | Says | Holds | Depends on |
  |---|---|---|---|
  | [performance-types.ts](../draft/app/_shared/types/performance-types.ts) | what happened in a match | `PlayerGameweekStatsData`, `Points`, `PointsBreakdown`, `PointsBreakdownItem` | nothing |
  | [player-types.ts](../draft/app/_shared/types/player-types.ts) | who a player is | `EnhancedPlayerData`, `PlayersByCode` | performance |
  | [squad-types.ts](../draft/app/_shared/types/squad-types.ts) | where a player is | `RosterPlayer`, `TeamPositionSlot`, `TeamRoster` | performance |

  **`RosterPlayer` does not reference `EnhancedPlayerData`.** It snapshots the identity fields it needs (`playerId`, `playerCode`, `playerName`, `playerPosition`) *at the time of assignment*, so a later change to a player's record cannot rewrite history on a team sheet. Player and squad are therefore siblings, not parent and child — they never refer to each other, and both depend only on performance. That is what made three files the honest split rather than one.

  Named `performance-types` rather than `points-types` because it holds the raw stat line too, which is not points. The rules that turn a stat line into points stay in `scoring/lib` — only the shapes moved.

  *Not to be confused with* `players/types/player-types.ts`, which stays in the players domain and holds view-models for the player pages. Same basename, different job; both docblocks say so.

  **Two things the original plan got wrong.**

  **1. The closure was bigger than the list.** `EnhancedPlayerData.draft.pointsBreakdown` is typed `PointsBreakdown` → `PointsBreakdownItem`, neither of which was listed. They had to come too, or the kernel would import `scoring`.

  **2. The acceptance criterion was unachievable as written.** It said all 3 `_shared/lib/fpl/*` entries would go. Only two were type imports. The third was a **value** import — `fpl-firestore.ts` ran `generateSeasonData` from `scoring/lib`, i.e. the scoring engine executing inside the shared persistence layer. No type move touches that. See below.

  ### ✅ The last one: `generateSeasonData` out of `fpl-firestore.ts`

  Same shape as the `player-gw-points` reader P2.3 moved, and fixed the same way. `FplFirestore.generateAndCacheEnhancedData` became [scoring/server/services/enhanced-player-data.service.ts](../draft/app/scoring/server/services/enhanced-player-data.service.ts), exposed on `scoring/index.server.ts`.

  Deciding what a player's season data *is* belongs to scoring; storing it belongs to the FPL persistence layer. The service reads the inputs, runs the engine, and hands the result to `updateElementsWithDraft` — both firestore methods it uses were already public, so nothing new was exposed.

  `preloadCommonData` no longer runs the scoring step; `admin`'s orchestrator sequences the two, which is what admin is for. Order (clear → bootstrap → enhanced) and the returned `results` shape are unchanged. The `FplFirestore` instance is passed in rather than constructed, so admin reuses the one it already holds.

  **⚠️ This last part is not covered by a test, and that is a real gap.** `FplFirestore` writes to Firestore over gRPC, which MSW cannot intercept — the same wall documented against `fplApiCache` in the testing conventions. Verified instead by type-check, the architecture rules, and `yarn build`. Worth an emulator-backed test if this area is touched again.

  *Verification:* type errors **unchanged at 176** before and after — the correct result for a type-only move, since none of it survives compilation (same check P2.1 used). 346 tests pass, ratchet counts all unchanged.

  **A fake ratchet win, caught and reverted.** Adding `biome-ignore-all lint/style/useNamingConvention` to the new `player-types.ts` dropped lint warnings 266 → 262, and `yarn ratchet` invited me to bank it. It was not a fix: `scoring-types.ts` had no such suppression, so `EnhancedPlayerData`'s four snake_case FPL field names were *counted* in the 266 baseline, and the ignore simply erased them. Removed, and the count is honestly back at 266. `squad-types.ts` keeps its suppression because those slot keys came from `team-types.ts`, which already had a file-level ignore — those were never in the count.

- [ ] **P2.2 — Split `team-types.ts` three ways**
  It currently does three jobs: domain entities, page view-models (`TeamViewData`), and React component props (`FormationDisplayProps`, `PositionSlotCardProps`, `TeamStatsProps`, `ContributingStatsProps`). That is why every domain has to import it.
  Kernel types → `_shared/types/` (P2.1). View-models → `teams/types/team-view-types.ts`. Component props → next to their components.
  *Acceptance:* `teams/types/team-types.ts` contains only teams-domain entities; the 28 `transfers → teams` and 13 `admin → teams` import edges mostly resolve to kernel imports.

- [x] **P2.3 — Make every sheets reader domain-free** — *replanned twice; the rule below is the settled one*

  **Original plan (moving each sheet into "its" domain) is abandoned.** Two problems killed it:

  1. **Most sheets have no single owner.** `user-teams` is read by six domains, `divisions` by five, `transfers` by four. Moving those into a domain's `server/` fixes Rule 1 while **breaking Rule 2** for every other reader — net worse.
  2. **Even where one domain is the sole reader today, moving it is wrong.** `cup.ts` was moved on that basis and then moved back. Sheets access is a cross-cutting concern: one spreadsheet, one client, one auth, one cache strategy. An exception to "sheet readers live in `_shared/lib/sheets/`" costs every future contributor the question *"where do we read sheets?"*, and it flips back the moment a second domain needs that data.

  **The settled rule:**
  > Every sheets reader lives in `_shared/lib/sheets/`. None of them import a domain. They return **raw row types** declared in `_shared/types/sheets-types.ts`; each domain interprets its own rows into its own model.

  That is one rule with no exceptions, and it fixes all 12 remaining violations by the same mechanism.

  *Rationale corrected 2026-07-28:* this item used to claim it was **what unblocks P3.4**, on the basis that a row-returning reader is trivial to fake. That is no longer the argument — MSW substitutes at the network boundary, so P3.4 does not need the seam. P2.3 still stands on its own terms (Rule 1: `_shared` must not import a domain), but it is no longer a prerequisite for loader tests, and the two can be done in either order.

  **P2.1 already did three of them for free.** `divisions.ts`, `user-teams.ts` and `players.ts` have zero domain imports because their types moved to the kernel. They are the model for the rest.

  | Module | Depends on | Fix |
  |---|---|---|
  | ~~`draft.ts`, `draft-order.ts`~~ | — | ✅ **done**, see below |
  | `transfers.ts` | `scoring/types`, `transfers/types` | return raw rows; `transfers` maps rows → `ProcessedTransfer` |
  | `cup.ts` | `cup/lib/cup-config`, `cup/types` | same shape as transfers |
  | `player-gw-points.ts` | `scoring/types`, **`scoring/lib`** | value import — scoring maths in a reader; move the calculation to the caller |
  | `draft.ts` | `draft/types`, **`draft/lib/draft-pick-calculator`** | value import — draft state derivation in a reader; return raw picks, let `draft` derive |
  | `fpl/api-cache.ts`, `fpl/fpl-firestore.ts` | `scoring/types`, **`scoring/lib`** | same treatment; `EnhancedPlayerData` to the kernel is P2.1b |

  ### ✅ `draft.ts` and `draft-order.ts` — done

  `currentPick` was the whole problem. It is **not a column in the sheet** (that column was
  removed) — it is derived from how many picks a division has made. The sheets reader was
  computing it, which is why `_shared` imported `draft/lib/draft-pick-calculator`.

  - Row shapes `DraftPickRow`, `DraftStateRow`, `DraftOrderRow` now live in `_shared/types/sheets-types.ts`. `DraftStateRow` deliberately has **no** `currentPick`.
  - `DraftStateData` in the draft domain is now `DraftStateRow & { currentPick }` — the relationship is expressed in the type rather than by two parallel declarations.
  - Derivation moved to [draft/lib/draft-state.ts](../draft/app/draft/lib/draft-state.ts). In `lib/`, not `server/`, so `admin` can orchestrate the draft without reaching into draft's server code.
  - `_shared/lib/sheets/draft.ts` and `draft-order.ts` now have **zero** domain imports.

  Two things fell out of it:
  - **A tautological check deleted.** `draft.server.ts` compared the state's stored `currentPick` against a recalculation and warned on mismatch. With one source they cannot disagree.
  - **`DraftPickRow.divisionId` was typed `string`**, not `DivisionId`. Tightening it was required to pass the row to `groupByDivision`.

  **Net 12 → 10, but it moved one dependency rather than removing it.** Taking the derivation out of the reader pushed it onto `_shared/lib/firestore-cache/firebase-draft-sync.ts`, which needs `currentPick` and now imports `draft/lib/draft-pick-calculator`. That is allowlisted with a comment, not hidden.

  ### ✅ Done — all three remaining readers

  | Reader | Was | Now |
  |---|---|---|
  | `player-gw-points.ts` | ran the scoring engine to decide what to write (the file carried a `// todo: should sheets have domains in it?`) | computation moved to `scoring/server/services/player-gw-points.service.ts`; the reader is handed rows and stores them |
  | `transfers.ts` | 389 lines; `readTransferDataForDivision` read **and** interpreted, which is why a sheets reader needed `PlayersByCode` and `GameWeekData` passed in | interpretation moved to `transfers/lib/transfer-rows.ts`; reader is 190 lines of I/O |
  | `cup.ts` | parsed the config and built `CupMatchup`s inside the reader | returns raw rows; `cup/server/cup-sheets.ts` parses. All four callers were already inside `cup/`, so no other domain moved |

  Row shapes moved to `_shared/types/sheets-types.ts`: `PlayerGameweekPointsRow`, `TransferSheetData`, `ProcessedTransferSheetData`, `CupSheetData`, `CupSubmissionRow`, `CupConfigRow`, `CupBracketRow`. Where a domain still wants the name, it re-exports from the kernel rather than redeclaring — the duplicate-type-name rule is enforcing, so redeclaring would fail the suite.

  **`_shared` → domain imports 9 → 3.** The three left are all `_shared/lib/fpl/*` and belong to **P2.1b**, not here. **Two more dependency cycles dissolved, 12 → 10.**

  **`CupSubmissionRow.stage` is deliberately `string`.** Narrowing it to `CupStageId` is what made `_shared` import `cup` in the first place; the cup domain does that narrowing now. Same shape as the `DraftStateRow.currentPick` decision from `draft.ts`.

  **Covered by tests, not just moved.** 37 new tests; suite **296 → 333**. This is the first use of MSW as the network boundary, per the convention agreed the same day — `msw` 2.15.0 installed pinned, with a reusable harness at `_shared/test/google-sheets-msw.ts`.

  | New/changed module | Tests |
  |---|---|
  | `scoring/server/services/player-gw-points.service.ts` | 8 — including the `teamName` regression, verified red against the old code before the fix was kept |
  | `transfers/lib/transfer-rows.ts` | 15 — status vocabulary, all six transfer types, gameweek derivation, loan fields, bad rows |
  | `cup/server/cup-sheets.ts` | 7 — config and bracket reads, plus a write round-trip proving what we write reads back unchanged |
  | `_shared/lib/sheets/player-gw-points.ts` | 7 — numeric coercion, summary maths, and that it refuses to write an empty table over a season of points |

  Two things about the harness are worth knowing before writing the next sheets test, and are documented in the steering doc: `google.auth.JWT` signs **locally**, so a throwaway RSA key is required; and the module under test must be imported **dynamically inside `beforeAll`**, because the sheets client memoises itself at module scope. Where MSW cannot reach — `fplApiCache` reads Firestore over gRPC — the app's own in-memory cache is seeded through its real API instead.

  **Found and fixed en route:** the `player-gw-points` sheet was writing `teamName: undefined` for every player. `EnhancedPlayerData` has `team_code`, not `team_name`, and the original carried a `// todo map to name`. It surfaced as a type error the moment the code moved into a file that was actually being checked. Fixed by mapping through `getFplTeams()` — type errors **177 → 176**.

  ### ✅ Resolved: the orchestrator question → P2.7

  `firebase-draft-sync.ts` is draft orchestration living in `_shared`, needed by both
  `draft` and `admin`. Moving it to `draft/server/` would only convert a Rule 1 violation
  into a Rule 2 one — the wall three items have now hit.

  **Decision: each domain gets a public API (`index.ts`).** See P2.7. Once `draft` exposes
  one, `firebase-draft-sync.ts` can move into the draft domain and `admin` can keep calling
  it legally. Its allowlist entry comes out then.

- [x] **P2.4 — Move domain logic out of `_shared/lib`**
  *Done:* five files moved with `git mv`, so history follows them. **`_shared` violations 17 → 12**, and **two domain cycles dissolved (15 → 13)**.

  | Module | New home | Why |
  |---|---|---|
  | `roster-conversion-utils.ts` + test | `teams/lib/` | operates on `TeamRoster`, `RosterPlayer`, `LoanStatus` |
  | `position-slot-utils.ts` | `teams/lib/` | operates on `TeamRoster` and slot keys |
  | `standings-table-markers.ts` + test | `leagues/lib/` | promotion/relegation/prize rows; one importer, in `leagues` |

  **`group-by-id.ts` was left in `_shared/lib` — this item's original plan was wrong.** `groupByDivision<T extends { divisionId }>` is a generic helper over a kernel type with no domain imports, and both its callers are in `admin`. Moving it to `teams/lib` would have made it *harder* to reach for no gain.

  `_shared/lib/` top level is now five genuinely generic modules — `batch-processor`, `form-data`, `fuzzy-string-match`, `group-by-id`, `query-client` — none of which import a domain.

  *Verification:* type errors unchanged at 200, 176 tests pass. The two tests that moved carried their coverage with them, which is the point of co-locating them.

  **All 12 remaining `_shared` violations are now in two folders**, both with a named owner:

  | Folder | Entries | Cleared by |
  |---|---|---|
  | `_shared/lib/sheets/` | 9 | P2.3 |
  | `_shared/lib/fpl/` | 3 | P2.1b |

- [x] **P2.7 — Give each domain a public API**
  Every domain gets an `index.ts` that re-exports what other domains are allowed to use. `components/`, `server/` and internal helpers become private.

  **Why this and not the alternatives.** Three items stalled on the same wall: `admin` orchestrates other domains — that is its entire purpose — and Rule 2 gave it no legal way to do so, which is why 10 `admin -> X/server` entries sit in the allowlist. The options were:

  | Option | Verdict |
  |---|---|
  | Exempt `admin` from Rule 2 | Honest about admin, but weakens the rule for the domain that reaches furthest |
  | Leave admin allowlisted forever | The same thing without admitting it |
  | **Public API per domain** | ✅ The boundary becomes explicit rather than assumed, and it works for every domain, not just admin |

  An index lets a domain say *"this operation is for others to call"* without exposing everything behind it. It also gives a natural home for the orchestration entry points admin needs.

  **Rule 2 is already updated** in [architecture.test.ts](../draft/app/architecture.test.ts) and [ai-contribution-rules.md](steering/ai-contribution-rules.md): `index.ts` is now a legal import target. `types/` and `lib/` remain accepted as **transitional**, because flipping to index-only in one go would turn ~60 working imports into violations. They are marked `TRANSITIONAL_PUBLIC_SEGMENTS` in the test and come out one domain at a time.

  **Order — start where the pain is:**

  | Domain | First job | |
  |---|---|---|
  | `draft` | expose draft state + sync so `firebase-draft-sync.ts` can move into the domain and `admin` can still call it | ✅ **done** |
  | `scoring` | `division-teams.service` has 6 importers across 5 domains — the single worst offender | ✅ **done** |
  | `transfers` | `transfers-data.service`, used by admin | next |
  | rest | as their allowlist entries come up | |

  ### ✅ `draft` — done

  `firebase-draft-sync.ts` moved from `_shared/lib/firestore-cache/` to `draft/server/` with `git mv`, so history follows it. Its only draft dependency (`calculateCurrentPick`) became internal, which is what made the move possible at all.

  - **`_shared` → domain imports 10 → 9**, and the allowlist entry P2.3 was forced to add is gone.
  - **A dependency cycle dissolved, 13 → 12.**
  - `admin` now calls draft orchestration through the public API instead of reaching into `_shared`.

  **Two things fell out of it, both worth knowing before doing the next domain:**

  **1. The rule did not recognise its own target.** A bare `import … from '../../draft'` resolves to `draft/index.ts`, but the parser recorded a segment-less path and reported it as reaching inside. Nobody had noticed, because no domain had an index yet. Fixed by normalising bare and extensionless index specifiers.

  **2. One barrel per domain would have been wrong.** See the decisions log — `index.ts` is client-safe, `index.server.ts` is for anything touching Firebase, Sheets or `process.env`. Without the split, `draft/index.ts` would have dragged the Firebase admin SDK into every component importing it, failing at runtime in the browser rather than at build time.

  ### ✅ `scoring` — done

  The worst Rule 2 offender in the codebase. **13 allowlist entries cleared in one change** — `MAY_REACH_INSIDE` 34 → 21.

  | Reached into | By |
  |---|---|
  | `scoring/server/services/division-teams.service` | `admin`, `cup`, `leagues`, `teams`, `transfers` — 8 imports |
  | `scoring/server/services/division-teams-points-population.service` | `admin` |
  | `scoring/server/services/gameweek-points.service` | `admin`, and `root.tsx` |
  | `scoring/components/points-breakdown-tooltip` | `players`, `transfers` |
  | `scoring/components/scoring-info` | `players` |

  Same two-entry-point split as `draft`: `index.ts` is client-safe (types, the scoring engine, `POSITION_RULES`); `index.server.ts` holds the division-teams documents and `GameweekPointsService`, which reach `firebase.admin` and its module-scope `process.env` read.

  **The scoring components are exposed rather than promoted to `_shared`.** Explaining a points figure is scoring's job — `PointsBreakdownTooltip` and `ScoringInfo` are scoring UI other pages embed, not generic widgets. That keeps them out of P2.5, which is for genuinely shared components like `gameweek-selector`.

  **Two of the imports were dynamic** (`await import(...)` inside a function body) and invisible to a grep of the import block. The architecture test caught both — it walks dynamic imports too, which is exactly why it exists.

  ### ✅ `transfers`, `leagues`, `wishlist`, `admin` — done

  **`MAY_REACH_INSIDE` 9 → 0. The debt register is empty.** Four indexes, nine call sites.

  | Domain | `index.ts` | `index.server.ts` |
  |---|---|---|
  | `transfers` | `LoanStatusDisplay` | `getTransfersDataForDivision` |
  | `leagues` | `PositionPointsTable` | `getAllLeagueStandingsData`, `getTeamOfTheWeek` |
  | `wishlist` | `WishlistButton`, `WishlistTags` | — none needed |
  | `admin` | — none | `handleCommitTeamsToFirestore` |

  **`wishlist` needs no server half** — it is backed by local storage, so nothing in it reaches Firebase, Sheets or `process.env`. **`admin` needs no client half**: its components are its own dashboard and nothing outside admin should render them.

  **Four of the nine were dynamic imports** (`await import(...)` inside a function body) and invisible to a grep of the import block — `homepage.route.tsx`, `team.server.tsx`, `system-status.service.ts` and `draft.server.ts`. Same lesson as the `scoring` index: the architecture test walks dynamic imports, which is why it keeps finding these.

  **`admin/index.server.ts` records an inversion rather than fixing one.** Admin orchestrates other domains — that is the premise of this whole item — but `draft/server/draft.server.ts` needs `handleCommitTeamsToFirestore`, which lives in admin's server actions. So this one dependency runs the *wrong way*: a feature domain reaching into admin. Exposing it makes the reach legal without making it right; the file says so in its own docblock. The underlying modelling problem is the `admin ↔ draft` cycle, already logged in *Found along the way* and now carried into P2.6.

  ### ✅ `TRANSITIONAL_PUBLIC_SEGMENTS` — emptied

  The other half of the acceptance. **64 cross-domain imports** reached `types/` and `lib/` directly; all are now routed through the indexes, and the flag is empty. **The index is the only way into a domain.**

  Two new indexes (`players`, `teams`) plus additions to the six that existed. Most of what was needed was already exported — `scoring` needed only `convertToGameweekStats`, `draft` only `DraftAction`.

  **`readTransferDataForDivision` went to `index.server.ts`, not `index.ts`**, even though it lives in `lib/`. It reaches the Sheets readers, so exporting it client-side would have made the whole transfers public API unsafe to import from a component — the exact failure the two-entry-point split exists to prevent. Worth knowing that `lib/` is *not* a reliable proxy for client-safe.

  **One narrow exemption was added: a test may use another domain's test fixtures.** `cup/lib/cup-squad.test.ts` builds a squad from `makeStandardRoster()` in `transfers/lib/validators/fixtures.ts`. That function returns a `TeamRoster` — a **kernel** type — and is not transfers-specific at all; it lives there only because transfers' validators needed a roster first. Both alternatives were worse: export a test fixture from the production public API, or duplicate the 13-slot roster per domain. The exemption is deliberately about *fixtures*, not tests in general — a test still may not reach another domain's `server/` or `components/`. **P4.3 owns the real fix** (it already renames that file); when the fixture moves somewhere shared, the exemption goes.

  *Acceptance (whole item):* ✅ each domain has an `index.ts`; ✅ `MAY_REACH_INSIDE` is empty; ✅ `TRANSITIONAL_PUBLIC_SEGMENTS` is empty, making the index the only cross-domain entry point.
  *Note:* `TRANSITIONAL_PUBLIC_SEGMENTS` is global, so it cannot come out until every domain has an index. `draft`'s own `types/` and `lib/` are still imported directly by `admin`, `players`, `transfers` and `scoring` — legal for now, and a tidy-up for when the flag goes.

- [x] **P2.5 — Promote genuinely shared components**
  `teams/components/gameweek-selector` is used by transfers, leagues, players and admin. `players/components/player` is used by teams, transfers, admin and wishlist. Both belong in `_shared/components/`.
  *Acceptance:* no domain imports another domain's `components/`; `architecture.test.ts` enforces it.

  ### ✅ `gameweek-selector` — done

  Moved to `_shared/components/` with `git mv`, so history follows it. **`MAY_REACH_INSIDE` 21 → 17.** Five importers updated — the four cross-domain ones plus `teams/components/team-view.tsx`, which owned it.

  It qualified without argument: its entire import list was react-router, `_shared/lib/fpl/fpl-types` and its own stylesheet — **zero domain imports** — so this was a move and four path rewrites, with no judgement call about what it means. A gameweek picker is not teams-domain UI; it only lived there because `teams` happened to need it first.

  *No cycle dissolved.* `teams ↔ leagues` survives it: `leagues/server/team-of-the-week.server.ts -> teams/types/team-types` is the other edge and is untouched by this.

  ### ✅ `players/components/player` — done

  The bigger cluster: **8 allowlist entries cleared. `MAY_REACH_INSIDE` 17 → 9.** Ten importers
  updated — the eight cross-domain ones, plus `players/player.page.tsx` and
  `players/components/player-stats-table.tsx`, which owned it.

  **P2.1b was genuinely the unblock, exactly as predicted.** Before it, `player.tsx` imported
  `EnhancedPlayerData` from `scoring/types`, so moving the file would have added new `_shared`
  → domain edges. With those types in the kernel, the moved file imports only
  `_shared/lib/fpl/fpl-types`, `_shared/types/league-types`, `_shared/types/player-types` and
  `_shared/types/squad-types` — **zero domain imports**, and `SHARED_MAY_IMPORT` stays empty.

  **`DisplayablePlayer` travelled with the component rather than going into the kernel.**
  `player.tsx` was its only consumer, and it is a component prop type — so it now lives in the
  component file, per "component props live next to their components". Putting it in the kernel
  would also have forced `player-types.ts` to import `squad-types.ts`, breaking the sibling
  relationship P2.1b just established.

  **Two cycles dissolved, not one — 8 → 6.** `players ↔ wishlist` was the predicted one:
  `wishlist-details.tsx -> players/components/player` was wishlist's only outbound edge to
  `players`. The second was unforecast, and falls out of `player-stats-table.tsx` being the
  tenth importer nobody had counted.

  **The tenth importer was nearly missed.** The grep used to find call sites filtered out
  filenames containing `player-stats-table`, which hid its `from './player'` sibling import.
  `yarn typecheck` caught it as +1 error against the 176 baseline — the ratchet earning its keep
  for the third time in this phase.

- [ ] **P2.6 — Decide the last cycles**
  `scoring ↔ players`, `scoring ↔ teams`, `scoring ↔ transfers`, `teams ↔ leagues`, `players ↔ wishlist`, `players ↔ draft` should all dissolve once P2.1–P2.5 land. Anything left is a genuine modelling problem and needs a decision, not a move.

  **15 → 6 as of P2.5.** `players ↔ wishlist` and `scoring ↔ players` are gone, as predicted. The six that remain, measured 2026-07-29:

  ```
  admin <-> draft        draft <-> players      draft <-> scoring
  leagues <-> teams      scoring <-> teams      scoring <-> transfers
  ```

  **Two of these were never on the original list** — `admin ↔ draft` and `draft ↔ scoring`. Note `draft/server/draft.server.ts -> admin/server/actions/team-commit-actions` is already logged in *Found along the way* as a domain reaching into **admin's** server actions, which inverts the intended direction; that is the `admin ↔ draft` pair and it needs a decision, not a move.

  P2.1–P2.5 have now taken every cycle a *move* can take. What is left is modelling, which is what this item always said it would be.
  *Acceptance:* the cycle check in `architecture.test.ts` passes with no exemptions.

---

## Phase 3 — Close the test gaps

Ordered by risk. The existing tests are good — this is a coverage-placement problem, not a testing-culture problem.

- [x] **P3.1 — Scoring aggregation functions**
  *Done:* 16 tests added to [calculations.test.ts](../draft/app/scoring/lib/calculations.test.ts); suite 176 → 192.

  `calculateGameweekPoints`, `calculateSeasonPoints` and `getFullBreakdown` produce every number a manager sees, and had no test. They do now, written **before** the Phase 2 refactoring that will move code around them — which was the point of principle 2, and which we had been quietly violating.

  Written at the consumer boundary: each test starts from **FPL-shaped gameweek data**, the same shape the live API returns, runs it through the real conversion and the real `POSITION_RULES`, and asserts the points that come out. Nothing reaches into how a total is assembled, so internals can be split, renamed or moved and these still hold.

  Coverage:
  - **Whole-match scenarios** per position — a centre back who scored and kept a clean sheet, a keeper who conceded and saved a penalty, a substitute wide attacker who was booked, red cards punished differently by position, an unused sub scoring nothing.
  - **A season equals the sum of its gameweeks.** If these ever disagree, a manager's season total stops matching the gameweeks it is made of — drift nobody notices until the table looks wrong.
  - **`total` equals the sum of its parts**, checked for all six positions. `total` is stored alongside the breakdown rather than derived on read, so the two can drift.
  - **The player-page breakdown reports the points it was given**, so a page cannot show a breakdown that fails to add up to the figure beside it.

  Every expected value was worked out by hand from `rules.ts` and is shown in the comments, so a failure says which rule broke rather than just which number moved. **All of them matched the implementation first time** — independent evidence the scoring engine is correct, not just self-consistent.

  *The ratchet earned its keep here:* the new fixture omitted 9 unused `FplPlayerGameweekData` fields, which `yarn ratchet` caught as +1 type error before commit.

- [x] **P3.2 — Cache TTL resolution and invalidation rules**
  *Done during P0.2/P0.3* — 19 tests in [cache-invalidation.test.ts](../draft/app/_shared/lib/cache/cache-invalidation.test.ts). Covers `getCacheTTL` for every key shape (including the `sheets:cup-config` / `sheets:cup` ordering trap and a check that no live key silently falls through to the default), every invalidation rule, and two structural tests asserting no rule is declared without a caller and none is called without being declared.

- [x] **P3.3 — Draft snake order and next-picker**
  *Done:* 4 test files, 47 tests; suite **249 → 296**. `draft/lib/` had zero tests despite holding the rule that decides whose turn it is.

  | File | Covers |
  |---|---|
  | `generate-draft-sequence.test.ts` | the reversal, the double pick at the turn of a round, continuous pick numbering, equal picks per manager, two-manager and empty edge cases |
  | `calculate-next-picker.test.ts` | who is "on deck", including the turn where the current picker is also next; end-of-draft; inactive/absent state |
  | `draft-pick-calculator.test.ts` | division scoping, the snake as the server records it, the empty-string "nobody" signal |
  | `draft-rules.test.ts` | position maximums, bench overflow, the 2-per-club hard block, unknown positions, full squad |

  **The snake rule is implemented three times** — `generateDraftSequence` (what the draft room shows), `calculateCurrentUserId` (what the server records) and `calculateNextPicker` (the "on deck" badge). If they drift, the room shows one manager's turn while the server accepts a pick from another. There is now a test asserting the first two produce identical picking orders across 2-, 3- and 5-manager drafts.

  **`calculateNextPicker` is deliberately one pick ahead.** It reads `currentPick + 1`, which looks like an off-by-one. It is not: the draft room renders it as "Get Ready..." with an `onDeck` class, i.e. the manager *after* the one currently picking. Confirmed against the component before writing the test, per the rule that a test must never encode a bug.

  *Acceptance:* ✅ all three named modules covered, even-round reversal included.
  *Not covered:* "the same player cannot be picked twice in a division". That guard is in `draft.server.ts:150`, not `lib/`, and needs the injection seam P3.4 is waiting on. Carried into P3.4.

- [x] **P3.4 — First route-loader test**
  Named as the priority boundary in the testing conventions, and there is still not one test there.

  **No longer hard-blocked on P2.3.** That block assumed the only way in was an injection seam. With MSW the substitution happens at the network boundary instead, so the sheets modules can be imported exactly as they are — and the real `googleapis` client, its auth and its parsing all run for real, which is better coverage than a fake client would give.

  *One-off setup cost, not a blocker:* `_shared/lib/sheets/utils/common.ts` uses `google.auth.JWT`, which signs a JWT **locally** with `credentials.private_key` before exchanging it at `oauth2.googleapis.com/token`. So a test needs a fixture service account (throwaway RSA key — the signature is never verified by anything in the test) plus MSW handlers for the token endpoint and `sheets.googleapis.com`. Write that helper once and every loader test reuses it.

  *Watch out:* `common.ts` memoises the client in a module-scope `sheetsClientPromise`, so it survives between tests in a file — the same singleton problem already logged against `DataCacheService`.

  *Also carries from P3.3:* the "same player cannot be picked twice in a division" rule, which lives in `draft.server.ts:150`.

  *Done:* [cup.route.test.ts](../draft/app/cup/cup.route.test.ts), 9 tests. The loader runs end to end — the real sheets client and parsing behind MSW, the real cup config parsing, the real (pure) `getCupPageData`. Nothing module-mocked. FPL values are seeded through `dataCache` because that side reads Firestore over gRPC, which MSW cannot intercept.

  Covers what a manager actually gets: the default gameweek, an explicit `?gameweek`, a squad hidden before the deadline and revealed after, a league with no cup configured, and a sheet that is unavailable. That last group is the point — every loader has a try/catch fallback and nothing exercised any of them.

  **Two of my first assertions were wrong, and the code was right.** Points come back `null` before the deadline (the visibility mechanic, working), and `rows` still lists managers when no round is configured (by design, rather than an empty screen). Both tests were rewritten to describe the intended behaviour rather than being "fixed" by changing the code.

  *Note:* `isDeadlinePassed` compares against the gameweek's **`end`**, not `deadline_time`. Non-obvious, and it cost a debugging cycle.

  *Acceptance:* ✅ one loader test exists and the pattern is documented in the testing conventions.
  Establish the pattern once — inject a fake sheets client returning fixtures, assert the loader's returned shape for a given URL and division — then replicate across loaders.
  *Acceptance:* one loader test exists and the pattern is documented in the testing conventions.

- [ ] **P3.5 — Add coverage reporting**
  Not as a gate — as a map of where to aim Phase 3 next.
  *Acceptance:* `yarn test --coverage` works; the report is not committed.

---

## Phase 4 — Consistency and size

Lowest risk, highest daily friction for new contributors.

- [ ] **P4.1 — One route convention, enforced**
  8 routes delegate to a `.page.tsx`; 11 hold their UI inline, including a 260-line `admin.route.tsx`. An AI has no way to infer which is correct.
  **Agreed convention: the route file owns the loader and action; the `.page.tsx` owns the UI.**
  Convert the 11 inline routes. Add the rule to [architecture.md](steering/architecture.md) *and* to `architecture.test.ts`.
  *Acceptance:* every `*.route.tsx` has a sibling `*.page.tsx`; the check is in `architecture.test.ts`.

- [ ] **P4.2 — Break up the oversized components**
  | File | Lines |
  |---|---|
  | `transfers/components/transfer-form.tsx` | 700 |
  | `teams/components/all-teams-table.tsx` | 577 |
  | `admin/components/sections/transfers-section.tsx` | 521 |
  | `draft/draft.tsx` | 451 |

  `transfer-form.tsx` is where a non-technical contributor is most likely to get lost. Extract real components, not `renderSomething()` helpers — per the React structure rule.
  *Acceptance:* no component file over ~250 lines in these four trees; behaviour unchanged.

- [ ] **P4.3 — Rename `transfers/lib/validators/fixtures.ts` → `test-fixtures.ts`**
  It holds *test* fixtures; `cup/lib/cup-fixtures.ts` holds *football* fixtures. Guaranteed to mislead.
  *Acceptance:* renamed; a note in the testing conventions that test fixture files are always `test-fixtures.ts`.

- [ ] **P4.4 — Settle on one server-file convention**
  Three patterns in use: `.server.ts` (10), `.service.ts` (13), `.server.tsx` (2). Document what each means, or collapse them.
  *Acceptance:* the convention is written down and the outliers are renamed.

- [x] **P4.5 — Bring `architecture.md` back in line with reality**
  *Done:* the route table listed **20 of 27** routes and the `cup/` domain (35 files, 12 test files — the best-tested in the app) was absent entirely. Since this file is loaded into every AI session via `CLAUDE.md`, every session was being told `cup/` did not exist while the backlog named it the reference implementation.

  | Fixed | |
  |---|---|
  | Route table | all 27 routes, grouped Pages / Cup / Admin / APIs, with the two traps called out — `admin-progress*` is **not** nested under `/admin`, and `cup/` and `admin/` own API routes inside their own folders rather than in `api/` |
  | Domain list | `cup/` added, plus a "read `cup/` first" pointer explaining *why* it is the reference (route convention, 12 test files, zero type errors) |
  | Domain model | a `Cup` section, sourced from `cup/lib/cup-rules.ts` rather than guessed: stages, 16 qualifiers, 4-player squads (6 in the final), two-legged middle rounds, the player-reuse ban and autopick DQ |
  | Sheets table | `Cup`, `CupConfig`, `CupBracket` added. Also corrected `PlayerGwPoints` → `player-gw-points`, which is the actual sheet name |

  **Went beyond the acceptance criteria, deliberately** — per principle 1, a doc that drifted once will drift again. Added **Rule 5** to [architecture.test.ts](../draft/app/architecture.test.ts): the route table must list every route in `routes.ts`, and must not list routes that no longer exist. Verified in both directions; it caught a real error in the prose during writing (a bare `cup.route.tsx` instead of the full path). P4.5 now cannot silently regress.

  *Acceptance:* ✅ domain list and route table match `routes.ts`; `cup/` documented; drift is now enforced rather than trusted.

---

## Found along the way

Add new issues here as they surface. Do not fix them in the task that found them — label, log, move on.

| Date | Label | Issue | Where |
|---|---|---|---|
| 2026-07-26 | **[Separate problem found]** | `no-descending-specificity` ×19 and `no-duplicate-selectors` ×14 — later rules overridden by earlier ones, and the same selector declared twice in a file. Each is a potential "why isn't my style applying" bug. Needs a human to decide intent per case. | various `.module.css` |
| 2026-07-26 | **[Will slow down future work]** | `DataCacheService` is a singleton with a `setInterval` started in its constructor at module import. Makes isolated testing awkward (tests share one instance and clear between cases) and keeps a timer alive in any process that imports it. | [data-cache.service.ts](../draft/app/_shared/lib/cache/data-cache.service.ts) |
| 2026-07-26 | **[Polish]** | `FplApiCache.clearFplCaches()` has zero callers. Kept and corrected rather than deleted, but if nothing calls it by the time Phase 2 lands, delete it. | [api-cache.ts](../draft/app/_shared/lib/fpl/api-cache.ts) |
| 2026-07-26 | **[Polish]** | `dataCache.delete()` is an alias for `dataCache.invalidate()`. Two names for one operation invites picking the wrong one. | [data-cache.service.ts](../draft/app/_shared/lib/cache/data-cache.service.ts) |
| 2026-07-26 | **[Fixed]** | `functions/` was not type-checked by `yarn type-check` or the ratchet — only by `yarn build`. It bit exactly as predicted: the dependabot batch in `16b4953` brought in `tough-cookie` 6, which stopped `@types/request` compiling, and **master's build was broken** while tests, types, CSS and lint were all green. Root cause was that `functions/tsconfig.json` declared no `types`, so `tsc` auto-included every `@types/*` in `node_modules` — including a stale transitive stub nothing here imports. Fixed by declaring `"types": ["node"]`, not by `skipLibCheck`, which would have hidden it. Now ratcheted as `functionsTypes`, baseline **0** — unlike the other counts there is no backlog to burn down, so anything above zero is a regression. Verified in both directions. | [functions/tsconfig.json](../functions/tsconfig.json), [ratchet.mjs](../scripts/ratchet.mjs) |
| 2026-07-26 | **[Will slow down future work]** | `keyframes-name-pattern` ×14 — keyframe names are not kebab-case. Cosmetic, but it is 14 of the 603 and trivially fixable in one pass. | various `.module.css` |
| 2026-07-26 | **[Separate problem found]** | `draft/server/draft.server.ts` imports `admin/server/actions/team-commit-actions`. A feature domain reaching into **admin's** server actions inverts the intended direction — admin orchestrates domains, not the reverse. Found by P1.2. | [draft.server.ts](../draft/app/draft/server/draft.server.ts) |
| 2026-07-26 | **[Fixed + tested]** | `formatPointsDisplay` rendered a negative total as `--3`: the negative branch built `` `-${points}` `` while `points` already carried its own sign. Visible in the Points column whenever a player scored negatively in a gameweek. Found by the subagent writing the table tests, which correctly declined to encode it. Reproduced with a failing test, then fixed. | [utils.ts](../draft/app/scoring/lib/utils.ts) |
| 2026-07-26 | **[Separate problem found]** | `formatPointsDisplay`'s docstring promised a `+` prefix on positive totals that was never implemented. Adding one changes every points figure in the UI, so it is a product decision rather than a bug fix. Deliberately left alone. | [utils.ts](../draft/app/scoring/lib/utils.ts) |
| 2026-07-26 | **[Partly fixed — decision open]** | The DC column displayed FPL's `defensive_contribution` aggregate while its tooltip computed points from the raw components against our custom position. **A regression from 6fca9d7**, which fixed the points and left the display behind. Wider than first logged: FPL's aggregate was the only DC stat in the app, shown in five places. **Gameweek half fixed in 3ed52bc**; the season columns still sum per-match counts (Gabriel reads 277 against a per-match threshold) and need a stored-shape change plus a data migration. Open decision in [#99](https://github.com/peter-mouland/kammy-ssg/issues/99). | [calculations.ts](../draft/app/scoring/lib/calculations.ts) |
| 2026-07-26 | **[Polish]** | Tooltips read `"1 points"` / `"-1 points"` — no singular form. | [player-gameweek-table.tsx](../draft/app/players/components/player-gameweek-table.tsx) |
| 2026-07-28 | **[Polish]** | `validateDraftEligibility` has an unreachable branch. The guard at `draft-rules.ts:158` requires `positionCount >= max && subCount >= 1`, which is exactly the condition the branch above it already returned on. Dead while `maxSubstitutes >= 1`. Found by P3.3 while working out which cases were reachable. | [draft-rules.ts](../draft/app/draft/lib/draft-rules.ts) |
| 2026-07-26 | **[Fixed + tested]** | The defensive-contribution tooltip on the player gameweek table always read **"0 points"** for every player. It passed `stat.defensiveContribution` (a number) where `calculateDefensiveContribution` expects the raw components object, so every field read came back `undefined`, the total was 0, and 0 is below every threshold. Invisible because it was a plausible-looking value. Surfaced only once `TableColumn.title` was declared and the compiler could finally see the call site. Now covered by rendering tests. | [player-gameweek-table.tsx](../draft/app/players/components/player-gameweek-table.tsx) |
| 2026-07-26 | **[Separate problem found]** | `DraftPickData.teamCode` and `FirebaseDraftPick.teamCode` are typed `string`, but callers assign a number (`FplTeam.code`). Surfaced by P1.3a once the surrounding code stopped being implicit `any`. Causes 3 of the 12 remaining `draft` errors, including a `number === string` comparison in [draft.tsx:202](../draft/app/draft/draft.tsx) that can never be true. Fix during the `draft` burn-down. | [draft-types.ts](../draft/app/draft/types/draft-types.ts) |
| 2026-07-29 | **[Fixed + measured]** | **The test suite was flaky — about one `yarn test` run in three failed**, always `Hook timed out in 10000ms` in the `beforeAll` of a file using the Sheets MSW harness. Nothing was wrong with those tests; they passed in isolation and `--no-file-parallelism` passed every time. **Root cause: `import { google } from 'googleapis'` costs 1.7s** because it loads Google's entire API surface to talk to one spreadsheet, and the harness convention put that import *inside a hook*, where vitest's 10s `hookTimeout` applies. Two wrong guesses first: the `Firebase service account not configured` stderr was a red herring from an unrelated passing test, and the 2048-bit RSA keygen was measured at only 148ms (1024 is 23ms). *Fixed* by moving `useFakeSheetsCredentials()` into `vitest.setup.ts`, which runs before a test file's imports — so the six sheets tests import statically and the cost lands in module collection, where no timeout applies. **8 consecutive green runs**, and the suite got faster: wall clock ~25s → **13s**, hook/test time 63s → **3.8s**. The `hookTimeout` was deliberately *not* raised — that widens the window rather than closing it. | [vitest.setup.ts](../draft/vitest.setup.ts), [google-sheets-msw.ts](../draft/app/_shared/test/google-sheets-msw.ts) |
| 2026-07-29 | **[Fixed + measured]** | **`googleapis` was the wrong dependency for this app.** `import { google } from 'googleapis'` loads Google's entire API surface — hundreds of clients — to talk to one spreadsheet. Measured on this machine: **~650ms warm, ~1.7s cold**, against **~78ms** for the scoped `@googleapis/sheets` (~8x). Paid on every Cloud Function **cold start**. *Fixed:* `@googleapis/sheets` 13.0.2 pinned exact; `googleapis` and `google-auth-library` removed as direct dependencies of `draft` (neither had any remaining source usage) and **`googleapis` is now gone from the dependency tree entirely**. Only one production import existed, in `common.ts`. | [common.ts](../draft/app/_shared/lib/sheets/utils/common.ts) |
| 2026-07-29 | **[Partly fixed]** | **`vite.config.ts` externals and `functions/package.json` are a hand-maintained pair, and nothing checks them.** *The client half is fixed:* `build.rollupOptions.external` listed server-only packages, but in a **client** build `external` means "emit the bare specifier" — which a browser cannot resolve — so it turned a loud build failure into a bundle that breaks only in a user's browser. Removed, with the reasoning in the file; verified the client output was already free of `@googleapis/sheets`, `google-auth-library` and `GOOGLE_SERVICE_ACCOUNT_KEY` either way. Server-only code stays out of the client because it is unreachable from it — React Router strips `loader`/`action` and their exclusive imports, and the `index.ts` / `index.server.ts` split (P2.7) stops a component importing anything that touches Firebase, Sheets or `process.env`. **Still open:** the `ssr.external` ↔ `functions/package.json` pairing is real and unchecked. The SSR build externalises named packages, so anything listed there must also be a dependency of `functions/package.json` — that is what Firebase installs at deploy time. Get it wrong and the build passes while the deployed function fails on first request. Found during the `@googleapis/sheets` swap: the externals still named `googleapis` and `google-auth-library` after nothing imported them, and `@googleapis/sheets` would have been silently *bundled* instead. This is the same class of gap as the `functions/` type errors that once broke master's build while everything else was green — a candidate for a `yarn ratchet`-style check. | [vite.config.ts](../draft/vite.config.ts), [functions/package.json](../functions/package.json) |
| 2026-07-26 | **[Will slow down future work]** | `scoring/server/services/division-teams.service` has 6 importers across admin, cup, leagues, teams and transfers. It is a de-facto shared service living in a feature domain — the server-side twin of the `gameweek-selector` problem. Decide its home during P2.3. | [division-teams.service.ts](../draft/app/scoring/server/services/division-teams.service.ts) |

---

## Deliberately not doing

| Idea | Why not |
|---|---|
| Fix all 275 type errors before resuming feature work | Blocks everything for weeks. The ratchet (P1.1) gets the same protection immediately. |
| ~~Component-level React tests~~ | **Reversed 2026-07-26.** This entry was wrong: `testing-conventions.md` warns against testing component *internals*, not against rendering, and it cites the Testing Trophy, which puts integration tests at the top. happy-dom + Testing Library are now installed and 46 rendering tests exist. See "Testing components" in the steering doc. |
| Testing component internals (props plumbing, state, the shape of a `columns` array) | Still off-limits. Render the component and assert what a user sees. |
| Adopt a dependency-graph library (dependency-cruiser, madge) for P1.2 | The import walker in [architecture.test.ts](../draft/app/architecture.test.ts) is ~60 lines, needs no new dependency or config file, and fails with a message a non-engineer can read. Revisit only if the rules outgrow it. |
