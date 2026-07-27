---
inclusion: always
---

# Architecture

## What is this project?

A draft-based fantasy football web app. Any anonymous user can join a league with friends. Each league week (gameweek), players earn points based on real-world football stats. Managers pick players in a snake draft — no player can be owned by more than one team within the same league. Managers can make transfers, trades, and loans within rules. At the end of the season, the winner is promoted and the loser is relegated across three divisions.

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
| `Divisions` | The three divisions (leagueOne, championship, premierLeague) |
| `UserTeams` | Manager → team → division assignments |
| `Draft` | All draft picks (pickNumber, round, userId, playerId, divisionId) |
| `DraftState` | Whether a draft is active and whose pick it is |
| `DraftOrder` | The snake order for each division draft |
| `Transfers` | All transfer requests (pending, approved, rejected) |
| `Players` | Custom player overrides (position, hidden flag, new flag) |
| `PlayerGwPoints` | Pre-computed per-player per-gameweek points |

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

### In-Memory Cache
`DataCacheService` in `_shared/lib/cache/` with per-key TTLs. Centralised config in `cache-config.ts` with invalidation rules per action type (e.g. `DRAFT_ACTION`, `TRANSFERS_PROCESSED`). TTL ranges from 30s (live transfers) to 24h (static reference data).

---

## Domain Structure

The `draft/app/` directory follows a **vertical domain + horizontal shared** layout. Features own their full slice (route, components, types, lib, server). Cross-cutting concerns live in `_shared/`.

```
draft/app/
├── _shared/        # Horizontal: utilities, FPL client, Sheets client, cache, shared components
├── admin/          # Admin dashboard — draft management, points processing, transfer approval
├── api/            # Server-side API routes (cache, transfers, fixtures)
├── draft/          # Live draft room — snake logic, pick calculator, Firebase real-time
├── homepage/       # Main dashboard
├── leagues/        # Division standings tables, team of the week
├── players/        # Player list + player detail pages
├── scoring/        # Points calculation engine (rules, formulas, generators)
├── teams/          # Team roster view (pitch layout, position slots, gameweek selector)
├── transfers/      # Transfer submission form + validation
└── wishlist/       # Local-storage-backed player wishlist
```

---

## Domain Model

### Divisions
`DivisionId`: `'leagueOne' | 'championship' | 'premierLeague'`

Three divisions. Winners of lower divisions are promoted; losers of upper divisions are relegated.

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
| `/` | `homepage/homepage.route.tsx` | Dashboard |
| `/teams/:userId?` | `teams/team.route.tsx` | Team roster view |
| `/leagues/:divisionId?` | `leagues/league-standings.route.tsx` | Division standings |
| `/draft` | `draft/draft.route.tsx` | Live draft room |
| `/players` | `players/players.route.tsx` | Player list |
| `/players/:playerCode` | `players/player.route.tsx` | Player detail |
| `/transfers/:divisionId?` | `transfers/transfers.route.tsx` | Transfer submission |
| `/wishlists` | `wishlist/wishlists.route.tsx` | Personal wishlist |
| `/admin` | `admin/admin.route.tsx` | Admin (nested) |
| `/admin/draft` | `admin/admin-draft.route.tsx` | Draft management |
| `/admin/points` | `admin/admin-points.route.tsx` | Points processing |
| `/admin/transfers` | `admin/admin-transfers.route.tsx` | Transfer approval |
| `/admin/setup-new-season` | `admin/admin-setup-new-season.route.tsx` | Season rollover checklist |
| `/scoring/api/gw-points` | `scoring/api/api.gw-points.ts` | Gameweek points API |
| `/api/transfers/:divisionId` | `api/transfers/api.transfers.ts` | Transfers data API |
| `/api/cache` | `api/cache/api.cache.ts` | Cache management API |

---

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

