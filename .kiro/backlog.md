# Codebase Improvement Backlog

A living plan to make this codebase safe for non-engineers and AI assistants to contribute to.

**This is not a steering file.** It is not loaded into every AI session. Read it when planning work, not when doing it.

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
Newest domain, 13 test files, zero type errors. When in doubt about how something should look, copy `cup/`.

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
| 2026-07-26 | **Sheets access is a cross-cutting concern. Every sheet reader lives in `_shared/lib/sheets/`, with no exceptions** | One spreadsheet, one client, one auth, one cache strategy — it is the app's persistence layer. Splitting a reader out because of who happens to read it today is arbitrary and reverses the moment a second domain needs that data. An exception costs every future contributor the question "where do we read sheets?" |

---

## Baseline

Re-measure with `yarn ratchet` and `yarn test`. Committed counts live in `.ratchet.json`.

| Metric | At start (2026-07-26) | Now |
|---|---|---|
| Type errors | 275 | **200** |
| CSS convention violations | not measurable (stylelint not installed) | **603** |
| Tests | 149 passing, 24 files | **176 passing, 26 files** |
| CI type check | `continue-on-error: true` — cannot fail a PR | ratcheted, blocking |
| Root `yarn type-check` | fails: `command not found: tsc` | works |
| Pre-commit hook | never ran (see P0.6) | runs lint-staged + tests |
| `_shared` → domain imports | 34, across 6 domains | **12** — P2.1 + P2.4 |
| Architecture rules enforced | 0 | **4** (P1.2) |
| Domain dependency cycles | 15 | **13** — P2.4 dissolved two |

### Type errors by domain

```
transfers  41     _shared    22     api         7
admin      32     scoring    15     wishlist    0
players    31     draft      12     cup         0  ← the target
teams      28     leagues    10     root        2
```

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
  *Done:* [architecture.test.ts](../draft/app/architecture.test.ts), 8 tests, no new dependency. Walks every relative import in `app/` (including dynamic `import()`) and enforces four rules:

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

  **The two allowlists are now the Phase 2 worklist.** Note how concentrated they are — `players/components/player` (7 importers), `teams/components/gameweek-selector` (5) and `scoring/server/services/division-teams.service` (6) account for 18 of the 34 internal-reach violations.

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

- [ ] **P2.1b — Move the data kernel**
  `EnhancedPlayerData`, `PlayersByCode`, `Points`, `PlayerGameweekStatsData`, `RosterPlayer`, `TeamPositionSlot`, `TeamRoster`. Larger than P2.1: `EnhancedPlayerData` alone appears in 37 files, and `TeamRoster` pulls in `TeamPositionSlot` → `Points` + `PlayerGameweekStatsData`.
  *Acceptance:* the 3 remaining `_shared/lib/fpl/*` allowlist entries are gone.

- [ ] **P2.2 — Split `team-types.ts` three ways**
  It currently does three jobs: domain entities, page view-models (`TeamViewData`), and React component props (`FormationDisplayProps`, `PositionSlotCardProps`, `TeamStatsProps`, `ContributingStatsProps`). That is why every domain has to import it.
  Kernel types → `_shared/types/` (P2.1). View-models → `teams/types/team-view-types.ts`. Component props → next to their components.
  *Acceptance:* `teams/types/team-types.ts` contains only teams-domain entities; the 28 `transfers → teams` and 13 `admin → teams` import edges mostly resolve to kernel imports.

- [ ] **P2.3 — Make every sheets reader domain-free** — *replanned twice; the rule below is the settled one*

  **Original plan (moving each sheet into "its" domain) is abandoned.** Two problems killed it:

  1. **Most sheets have no single owner.** `user-teams` is read by six domains, `divisions` by five, `transfers` by four. Moving those into a domain's `server/` fixes Rule 1 while **breaking Rule 2** for every other reader — net worse.
  2. **Even where one domain is the sole reader today, moving it is wrong.** `cup.ts` was moved on that basis and then moved back. Sheets access is a cross-cutting concern: one spreadsheet, one client, one auth, one cache strategy. An exception to "sheet readers live in `_shared/lib/sheets/`" costs every future contributor the question *"where do we read sheets?"*, and it flips back the moment a second domain needs that data.

  **The settled rule:**
  > Every sheets reader lives in `_shared/lib/sheets/`. None of them import a domain. They return **raw row types** declared in `_shared/types/sheets-types.ts`; each domain interprets its own rows into its own model.

  That is one rule with no exceptions, and it fixes all 12 remaining violations by the same mechanism. It is also what creates the injection seam P3.4 needs — a reader that only returns rows is trivial to fake.

  **P2.1 already did three of them for free.** `divisions.ts`, `user-teams.ts` and `players.ts` have zero domain imports because their types moved to the kernel. They are the model for the rest.

  | Module | Depends on | Fix |
  |---|---|---|
  | `draft-order.ts` | `draft/types` | `DraftOrderData` is a plain sheet row → `_shared/types/sheets-types.ts` |
  | `transfers.ts` | `scoring/types`, `transfers/types` | return raw rows; `transfers` maps rows → `ProcessedTransfer` |
  | `cup.ts` | `cup/lib/cup-config`, `cup/types` | same shape as transfers |
  | `player-gw-points.ts` | `scoring/types`, **`scoring/lib`** | value import — scoring maths in a reader; move the calculation to the caller |
  | `draft.ts` | `draft/types`, **`draft/lib/draft-pick-calculator`** | value import — draft state derivation in a reader; return raw picks, let `draft` derive |
  | `fpl/api-cache.ts`, `fpl/fpl-firestore.ts` | `scoring/types`, **`scoring/lib`** | same treatment; `EnhancedPlayerData` to the kernel is P2.1b |

  **The two value imports are the real leak.** A reader that computes draft state or scoring points is doing domain work in the persistence layer; the type imports are cosmetic by comparison. Start there.

  *Acceptance:* `_shared/lib/sheets/` and `_shared/lib/fpl/` have zero domain imports; the `SHARED_MAY_IMPORT` allowlist is empty; loaders return identical data.

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

- [ ] **P2.5 — Promote genuinely shared components**
  `teams/components/gameweek-selector` is used by transfers, leagues, players and admin. `players/components/player` is used by teams, transfers, admin and wishlist. Both belong in `_shared/components/`.
  *Acceptance:* no domain imports another domain's `components/`; `architecture.test.ts` enforces it.

- [ ] **P2.6 — Confirm the cycles are gone**
  `scoring ↔ players`, `scoring ↔ teams`, `scoring ↔ transfers`, `teams ↔ leagues`, `players ↔ wishlist`, `players ↔ draft` should all dissolve once P2.1–P2.5 land. Anything left is a genuine modelling problem and needs a decision, not a move.
  *Acceptance:* the cycle check in `architecture.test.ts` passes with no exemptions.

---

## Phase 3 — Close the test gaps

Ordered by risk. The existing tests are good — this is a coverage-placement problem, not a testing-culture problem.

- [ ] **P3.1 — Scoring aggregation functions**
  [calculations.ts](../draft/app/scoring/lib/calculations.ts) has 15 exported functions; only 4 leaves are tested. `calculateGameweekPoints`, `calculateSeasonPoints` and `getFullBreakdown` are untested — and they are what every user sees on every page. Highest-value missing test in the repo.
  Include: that `calculateSeasonPoints` and `calculateGameweekPoints` agree over the same input, and that `total` equals the sum of the breakdown.
  *Acceptance:* all three covered with stat-line-in / points-out tests, per [testing-conventions.md](steering/testing-conventions.md).

- [ ] **P3.2 — Cache TTL resolution and invalidation rules**
  Named explicitly in the testing conventions, and P0.2 is exactly the bug a test would have caught.
  Cover: `getCacheTTL` returns the right TTL for each key shape (including the `sheets:cup-config` / `sheets:cup` ordering trap), and each invalidation rule clears what it claims to and nothing else.
  *Acceptance:* both covered; P0.2's regression test lives here.

- [ ] **P3.3 — Draft snake order and next-picker**
  `draft/lib/` has zero tests. Named explicitly in the testing conventions: snake order generation, and that the same player cannot be picked twice in a division.
  *Acceptance:* `generate-draft-sequence`, `calculate-next-picker` and `draft-rules` covered, including the even-round reversal.

- [ ] **P3.4 — First route-loader test**
  Named as the priority boundary in the testing conventions, currently impossible because sheets modules are imported directly with no injection seam. **Blocked on P2.3.**
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

- [ ] **P4.5 — Bring `architecture.md` back in line with reality**
  It does not mention the `cup/` domain at all (35 files) and its route table is missing 8 routes. This file is loaded into **every** AI session — stale steering produces confidently wrong output. Cheapest high-impact fix on the list; do it early if there is a spare hour.
  Add a "read this first" pointer to `cup/` as the reference implementation.
  *Acceptance:* domain list and route table match `routes.ts`; `cup/` documented.

---

## Found along the way

Add new issues here as they surface. Do not fix them in the task that found them — label, log, move on.

| Date | Label | Issue | Where |
|---|---|---|---|
| 2026-07-26 | **[Separate problem found]** | `no-descending-specificity` ×19 and `no-duplicate-selectors` ×14 — later rules overridden by earlier ones, and the same selector declared twice in a file. Each is a potential "why isn't my style applying" bug. Needs a human to decide intent per case. | various `.module.css` |
| 2026-07-26 | **[Will slow down future work]** | `DataCacheService` is a singleton with a `setInterval` started in its constructor at module import. Makes isolated testing awkward (tests share one instance and clear between cases) and keeps a timer alive in any process that imports it. | [data-cache.service.ts](../draft/app/_shared/lib/cache/data-cache.service.ts) |
| 2026-07-26 | **[Polish]** | `FplApiCache.clearFplCaches()` has zero callers. Kept and corrected rather than deleted, but if nothing calls it by the time Phase 2 lands, delete it. | [api-cache.ts](../draft/app/_shared/lib/fpl/api-cache.ts) |
| 2026-07-26 | **[Polish]** | `dataCache.delete()` is an alias for `dataCache.invalidate()`. Two names for one operation invites picking the wrong one. | [data-cache.service.ts](../draft/app/_shared/lib/cache/data-cache.service.ts) |
| 2026-07-26 | **[Separate problem found]** | `functions/` workspace is not type-checked by `yarn type-check` or the ratchet — only by `yarn build`. Its error count is unmeasured. | root `package.json` |
| 2026-07-26 | **[Will slow down future work]** | `keyframes-name-pattern` ×14 — keyframe names are not kebab-case. Cosmetic, but it is 14 of the 603 and trivially fixable in one pass. | various `.module.css` |
| 2026-07-26 | **[Separate problem found]** | `draft/server/draft.server.ts` imports `admin/server/actions/team-commit-actions`. A feature domain reaching into **admin's** server actions inverts the intended direction — admin orchestrates domains, not the reverse. Found by P1.2. | [draft.server.ts](../draft/app/draft/server/draft.server.ts) |
| 2026-07-26 | **[Separate problem found]** | `DraftPickData.teamCode` and `FirebaseDraftPick.teamCode` are typed `string`, but callers assign a number (`FplTeam.code`). Surfaced by P1.3a once the surrounding code stopped being implicit `any`. Causes 3 of the 12 remaining `draft` errors, including a `number === string` comparison in [draft.tsx:202](../draft/app/draft/draft.tsx) that can never be true. Fix during the `draft` burn-down. | [draft-types.ts](../draft/app/draft/types/draft-types.ts) |
| 2026-07-26 | **[Will slow down future work]** | `scoring/server/services/division-teams.service` has 6 importers across admin, cup, leagues, teams and transfers. It is a de-facto shared service living in a feature domain — the server-side twin of the `gameweek-selector` problem. Decide its home during P2.3. | [division-teams.service.ts](../draft/app/scoring/server/services/division-teams.service.ts) |

---

## Deliberately not doing

| Idea | Why not |
|---|---|
| Fix all 275 type errors before resuming feature work | Blocks everything for weeks. The ratchet (P1.1) gets the same protection immediately. |
| Component-level React tests | Contrary to [testing-conventions.md](steering/testing-conventions.md) — test at the boundaries, not React internals. Would also need a jsdom environment we do not currently have. |
| Adopt a dependency-graph library (dependency-cruiser, madge) for P1.2 | The import walker in [architecture.test.ts](../draft/app/architecture.test.ts) is ~60 lines, needs no new dependency or config file, and fails with a message a non-engineer can read. Revisit only if the rules outgrow it. |
