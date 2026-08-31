---
inclusion: always
---

# Architecture

## What is this project?

A draft-based fantasy football web app. Any anonymous user can join a league with friends. Each league week (gameweek), players earn points based on real-world football stats. Managers pick players in a snake draft — no player can be owned by more than one team within the same league. Managers can make transfers, trades, and loans within rules. At the end of the season, the winner is promoted and the loser is relegated — across the divisions that take part in promotion and relegation, which is not all of them.

---

## Monorepo Structure

```
kammy-ssg/
├── draft/          # The main React application (SSR + client)
└── functions/      # Firebase Cloud Functions (hosts the SSR app)
```

Build flow: `draft` builds with Vite → output copied into `functions/build/` → `functions` compiles with tsc → both deploy to Firebase Hosting + Cloud Functions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Router v7 (SSR mode) + React 19 |
| Build | Vite 7 + `@react-router/dev` |
| Language | TypeScript 5.9 throughout |
| Styling | CSS Modules + PostCSS + design tokens |
| Client data | TanStack Query v5 |
| Hosting | Firebase Hosting + Cloud Functions v2 (Node 22) |
| SSR server | Express via `@react-router/express` |
| Linting/Formatting | Biome 2 |
| Package manager | Yarn 4 (Berry) |

---

## Data Sources

There are three data sources with a layered caching strategy.

### Google Sheets (source of truth for league data)
All league configuration and management decisions live here — managed by admins.

| Sheet | Purpose |
|---|---|
| `Divisions` | The divisions, and what each takes part in (`promotion`, `relegation`, `cup` columns) |
| `UserTeams` | Manager → team → division assignments |
| `Draft` | All draft picks (pickNumber, round, userId, playerId, divisionId) |
| `DraftState` | Whether a draft is active and whose pick it is |
| `DraftOrder` | The snake order for each division draft |
| `Transfers` | All transfer requests (pending, approved, rejected) |
| `Players` | Custom player overrides (position, hidden flag, new flag) |
| `player-gw-points` | Pre-computed per-player per-gameweek points |
| `Cup` | Cup squad submissions |
| `CupConfig` | Cup rounds, deadlines and settings |
| `CupBracket` | Knockout bracket state |

Access: `googleapis` with a service account (base64 credentials in env). Each sheet has its own module in `draft/app/_shared/lib/sheets/`.

### FPL API (live player and gameweek data)
Live data from `https://fantasy.premierleague.com/api/`:

- `bootstrap-static/` — all players, teams, gameweek calendar
- `element-summary/{id}/` — per-player gameweek history
- `event/{gw}/live/` — live gameweek scores

Backed by Firestore as a persistent cache to avoid hammering the FPL API.

### Firebase / Firestore (cache + real-time draft)
- **Firestore** — persistent cache for expensive FPL + scoring computations. Collections: `fpl-bootstrap`, `fpl-elements`, `division-teams`, `cache-state`
- **Realtime Database** — live draft state sync between users during a live draft. Clients subscribe via `@firebase/database`

### Substituting all three, offline
`yarn dev:fixtures` runs the real app against `test-fixtures/` with no credentials — Sheets and FPL
over MSW, Firestore swapped for an in-memory driver (`_shared/lib/firestore-cache/firestore-memory.ts`,
gated on `KAMMY_FIXTURE_FIRESTORE=1`), and the season rebuilt at boot by `draft/harness/rebuild-season.ts`.
The date is a URL parameter — see *Running it locally*. **Green there and red in production means the
fault is data, not code.**

### The clock
`_shared/lib/clock.ts` is where "now" comes from; `new Date()` at a decision site is a bug waiting to
happen. `clock.server.ts` adds `runWithNow` for per-request time travel and is split out because
`node:async_hooks` cannot be in a browser bundle. Production sets no override, so `now()` is the real
date there. Cache TTL arithmetic deliberately does **not** use it.

### In-Memory Cache
`DataCacheService` in `_shared/lib/cache/` with per-key TTLs. Centralised config in `cache-config.ts` with invalidation rules per action type (e.g. `DRAFT_ACTION`, `TRANSFERS_PROCESSED`). TTL ranges from 30s (live transfers) to 24h (static reference data).

---

## Domain Structure

The `draft/app/` directory follows a **vertical domain + horizontal shared** layout. Features own their full slice (route, components, types, lib, server). Cross-cutting concerns live in `_shared/`.

```
kammy-ssg/
├── test-fixtures/  # A whole season of captured data. Read-only, never imported by the app
└── draft/
    ├── harness/    # The offline fixture server + season rebuild. OUTSIDE app/ on purpose:
    │               # it orchestrates several domains, which nothing in app/ may do
    └── app/        # ↓ the domains below
```

```
draft/app/
├── _shared/        # Horizontal: utilities, FPL client, Sheets client, cache, shared components
├── admin/          # Admin dashboard — draft management, points processing, transfer approval
├── api/            # Server-side API routes (cache, transfers, fixtures)
├── cup/            # Cross-division knockout cup — squad submission, brackets, cup scoring
├── draft/          # Live draft room — snake logic, pick calculator, Firebase real-time
├── homepage/       # Main dashboard
├── leagues/        # Division standings tables, team of the week
├── players/        # Player list + player detail pages
├── scoring/        # Points calculation engine (rules, formulas, generators)
├── teams/          # Team roster view (pitch layout, position slots, gameweek selector)
├── transfers/      # Transfer submission form + validation
└── wishlist/       # Local-storage-backed player wishlist
```

### Read `cup/` first

**`cup/` is the reference implementation.** It is the newest domain and the one to copy when you are unsure how something should look:

- Routes follow the agreed convention — `cup/cup.route.tsx` owns the loader and action, `cup/cup.page.tsx` owns the UI.
- It is the best-tested domain in the app: 12 test files, all consumer-focused.
- Zero type errors, while the rest of the codebase still carries a backlog of them (`yarn ratchet`).

If a pattern here disagrees with what you find elsewhere, `cup/` is more likely to be right.

---

## Domain Model

### Divisions
`DivisionId`: `'leagueOne' | 'championship' | 'premierLeague' | 'greatScott'`

**What a division takes part in is data, not something to infer from its id or its rank.** The
`Divisions` sheet carries `promotion`, `relegation` and `cup` columns, read into
`DivisionSheetData` and used via `_shared/lib/league-divisions.ts`.

| division | order | promotion | relegation | cup |
|---|---|---|---|---|
| `premierLeague` | 1 | — (top) | ✅ | ✅ |
| `championship` | 2 | ✅ | ✅ | ✅ |
| `leagueOne` | 3 | ✅ | — (bottom of the pyramid) | ✅ |
| `greatScott` | 4 | — | — | — |

`greatScott` is standalone: it plays in nothing cross-division. **Do not derive these rules from
`order`** — greatScott sorts last, so rank-based logic moves relegation onto it and off
leagueOne, which is exactly backwards. This was inferred from the id (`!== 'premierLeague'`,
`!== 'leagueOne'`) until a fourth division made that wrong.

Adding a division means: the `DivisionId` union, `KNOWN_DIVISION_IDS`, and a row in the sheet.
`/admin` shows a banner naming any division in the sheet the build does not recognise.

### Managers
`ManagerId = string`. Each manager has a `userId`, `userName`, `teamName`, and belongs to one `divisionId`.

### Players
`EnhancedPlayerData` — FPL base data enriched with draft-layer metadata:
- FPL fields: `id`, `code`, `first_name`, `second_name`, `web_name`, `team_code`
- Draft fields: `position: CustomPosition`, `pointsTotal`, `pointsBreakdown`, `isHidden`, `isNew`

**Custom positions** (differ from FPL's 4-type system):
`'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca'`

### Team Rosters
Each team has 13 fixed position slots: `gk_0`, `cb_0/1`, `fb_0/1`, `mid_0/1`, `wa_0/1`, `ca_0/1`, `sub_0`, `on_loan_0`.

Each slot holds a `RosterPlayer` (who is in the slot) + per-gameweek and cumulative season `Points`.

### Draft (snake format)
- Snake draft: even rounds reverse the pick order
- Draft is division-scoped — a player can only be drafted once per division
- State is tracked in both Google Sheets and Firebase Realtime Database (sync comparison exists to detect drift)

### Transfers
Types: `TRANSFER | SWAP | LOAN_START | LOAN_END | TRADE | NEW_PLAYER`
Status: `APPROVED | REJECTED | PENDING`

Submitted by managers, approved/rejected by admins via the Admin UI. Loans track `onLoanTo` and `onLoanFrom` fields on the roster player.

### Cup
A **cross-division** knockout — the one feature that ignores division boundaries. Rules live in `cup/lib/cup-rules.ts`.

Stages run `league → r16 → qf → sf → final`. The top **16** managers across all divisions qualify from the league stage. Every stage needs a squad of **4** players except the Grand Final, which needs **6**. The middle rounds (`r16`, `qf`, `sf`) are **two-legged**; league stage and final are single-leg.

Two rules drive most of the logic:
- **Player-reuse ban** — a player used in one leg of a round cannot be reused in the other leg of that round.
- **Autopick disqualification** — a missed deadline auto-picks a manager's squad; reaching `MAX_AUTOPICKS_BEFORE_DQ` (2) in a stage disqualifies them.

### Scoring
Custom points per position, per stat. Rules live in `scoring/lib/rules.ts` as `POSITION_RULES`.

Example rules:
- GK goal: 10pts | CB/FB goal: 8pts | MID/WA/CA goal: 4pts
- Clean sheet: 5pts (GK/FB/CB), 2pts (MID), 0pts (WA/CA)
- Appearance: 1pt (<45 min), 3pts (45+ min)
- Assists: 3pts (all positions)
- Yellow card: -1pt | Red card: -3 to -5pts depending on position
- Defensive contribution (BPS threshold): 1–2pts for defensive positions

---

## Routes

| URL | File | Purpose |
|---|---|---|
Mirrors [routes.ts](../../draft/app/routes.ts). If you add a route, add it here.

**Pages**

| URL | File | Purpose |
|---|---|---|
| `/` | `homepage/homepage.route.tsx` | Dashboard |
| `/teams/:userId?` | `teams/team.route.tsx` | Team roster view |
| `/leagues/:divisionId?` | `leagues/league-standings.route.tsx` | Division standings |
| `/draft` | `draft/draft.route.tsx` | Live draft room |
| `/players` | `players/players.route.tsx` | Player list |
| `/players/:playerCode` | `players/player.route.tsx` | Player detail |
| `/transfers/:divisionId?` | `transfers/transfers.route.tsx` | Transfer submission |
| `/wishlists` | `wishlist/wishlists.route.tsx` | Personal wishlist |
| `/rules` | `rules/rules.route.tsx` | League rules (embedded Google Doc) |

**Cup** (cross-division knockout)

| URL | File | Purpose |
|---|---|---|
| `/cup` | `cup/cup.route.tsx` | Bracket and standings |
| `/cup/submit` | `cup/cup-submit.route.tsx` | Squad submission |
| `/cup/admin` | `cup/cup-admin.route.tsx` | Cup administration |

**Admin** (nested under `/admin`)

| URL | File | Purpose |
|---|---|---|
| `/admin` | `admin/admin.route.tsx` | Admin shell (parent route) |
| `/admin` (index) | `admin/admin-overview.route.tsx` | Admin overview |
| `/admin/draft` | `admin/admin-draft.route.tsx` | Draft management |
| `/admin/points` | `admin/admin-points.route.tsx` | Points processing |
| `/admin/settings` | `admin/admin-settings.route.tsx` | Admin settings |
| `/admin/setup-new-season` | `admin/admin-setup-new-season.route.tsx` | Season rollover checklist |
| `/admin/transfers` | `admin/admin-transfers.route.tsx` | Transfer approval |
| `/admin-progress/:jobId` | `admin/admin-progress.route.tsx` | Long-running job progress (legacy, top-level) |
| `/admin-progress-poll/:jobId` | `admin/admin-progress-poll.route.tsx` | Job progress polling (legacy, top-level) |
| `/debug` | `admin/debug.route.tsx` | Debug page |

**APIs and data endpoints**

| URL | File | Purpose |
|---|---|---|
| `/players.json` | `players/players-json.route.ts` | Player list as JSON |
| `/players/:playerCode.json` | `players/player-json.route.ts` | Player detail as JSON |
| `/scoring/api/gw-points` | `scoring/api/api.gw-points.ts` | Gameweek points API |
| `/api/transfers/:divisionId` | `api/transfers/api.transfers.ts` | Transfers data API |
| `/api/cache` | `api/cache/api.cache.ts` | Cache management API |
| `/api/admin/draft-sync-comparisons` | `admin/api/api.admin.draft-sync-comparisons.ts` | Sheets/Firebase draft drift check |

Note that `admin-progress` and `admin-progress-poll` are **not** nested under `/admin` despite the name, and that `cup/` and `admin/` both own API routes inside their own domain folder rather than in `api/`.

---

## Running it locally

Two ways to start the app, and they answer different questions.

| command | data source | port | use it when |
|---|---|---|---|
| `yarn dev` | **real** Sheets, FPL and Firestore | 5173 | working against live data |
| `yarn dev:fixtures` | **fixtures only** — no network, no credentials | 3100 | the real app 500s and you need to know whether it is the code or the data |

`yarn dev` syncs `.env.local` into the workspaces first. `yarn dev:fixtures` needs no
credentials at all: Sheets and FPL are served over MSW from `test-fixtures/`, Firestore is an
in-memory driver, and the whole season is rebuilt at boot (~6s, 117 documents).

**The fixture server takes the date as a URL parameter.** This is the only way to see the site
in a state other than "today":

```
http://localhost:3100/?now=2025-01-10     # mid-season, GW21
http://localhost:3100/?now=2024-08-16     # GW1, before the first deadline
http://localhost:3100/?now=2025-05-26     # after the final deadline, GW38
http://localhost:3100/?now=clear          # back to real time
```

`?now=` sets a cookie, so you set the date once and then browse normally. Two browsers can sit
at two different dates against the same server.

**If it is green here and red in production, the fault is data, not code.** The fixture server
proves the code path end to end; it changes nothing about the real app. Repopulating real
Firestore is what `/admin` is for — `populateBootstrapData`, then commit teams per division,
then points processing.

Other entry points:

```bash
yarn local        # firebase emulators
yarn build        # the ONLY thing that type-checks the functions workspace
yarn start        # serve the production build locally (needs yarn build first)
yarn test         # vitest, including the harness rebuild
yarn ratchet      # type errors / CSS violations / lint warnings must not increase
```

`yarn preview` is broken — it delegates to a `draft preview` script that does not exist.

Environment variables the harness understands (none are set in production):

| variable | effect |
|---|---|
| `KAMMY_FIXTURE_FIRESTORE=1` | swap Firestore for the in-memory driver. `dev:fixtures` sets it |
| `KAMMY_FAKE_NOW=<iso>` | freeze the clock for a whole process |
| `PORT` | fixture server port, default 3100 |
| `FIRESTORE_EMULATOR_HOST` | use the real Firestore emulator instead (needs Java) |

## Deployment

```bash
yarn build        # builds draft + copies to functions + compiles functions
firebase deploy   # deploys hosting + functions
```

Firebase Hosting rewrites: static assets served directly, all other requests routed to the `ssr` Cloud Function (Express + React Router). Cache headers: static assets are immutable (1yr), HTML pages are no-cache.

---

## Environment Variables

See `.env.example`. Key variables:
- `GOOGLE_SHEETS_ID` — spreadsheet ID
- `GOOGLE_SHEETS_CREDENTIALS` — base64-encoded service account JSON
- `FIREBASE_*` — Firebase project config

