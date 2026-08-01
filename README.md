# Fantasy Football Draft Application

A comprehensive React Router v7 application for managing division-based fantasy football drafts with Google Sheets as the database and FPL API integration.

## Features

### Core Functionality
- **Division-based League System**: Organize teams into separate divisions
- **Snake Draft System**: Automated draft order with snake format (even rounds reverse order)
- **Real-time Draft Interface**: Live draft room with Server-Sent Events
- **Custom Points System**: Position-based scoring with detailed breakdowns
- **FPL API Integration**: Live player data and statistics
- **Google Sheets Database**: Header-based parsing with robust error handling

### Pages & Routes

> **This list is out of date** — `/my-team`, `/generate-draft` and `/player/$playerId` no longer
> exist. The route table in [`.kiro/steering/architecture.md`](.kiro/steering/architecture.md) is
> the accurate one, and `architecture.test.ts` fails if it drifts from `routes.ts`. The same goes
> for the *Project Structure* tree below.

- **Dashboard** (`/`) - League overview with top players and standings
- **Team Management** (`/my-team`) - View league standings with division filtering
- **Live Draft** (`/draft`) - Real-time draft interface with player selection
- **Draft Setup** (`/generate-draft`) - Generate draft orders and manage draft state
- **Player Details** (`/player/$playerId`) - Detailed player stats and custom points breakdown

### Technical Features
- **Server-Side Rendering** with React Router v7
- **TypeScript** throughout with comprehensive type definitions
- **Vite** for fast development and building
- **Google Sheets API** integration with service account authentication
- **Header-based Sheet Parsing** for flexible data structure
- **Custom Points Calculation** with position-specific rules
- **Real-time Updates** via Server-Sent Events
- **Responsive Design** with mobile-friendly interface

## Project Structure

```
app/
├── lib/
│   ├── fpl/
│   │   └── api.ts                 # FPL API integration
│   ├── points.ts                  # Custom points calculation system
│   └── sheets/
│       ├── common.ts              # Common Google Sheets utilities
│       ├── divisions.ts           # Divisions sheet management
│       ├── user-teams.ts           # User teams sheet management
│       ├── draft.ts               # Draft picks & state management
│       ├── draft-order.ts          # Draft order management
│       └── player-stats.ts         # Player statistics management
├── routes/
│   ├── admin-dashboard.tsx                 # Dashboard page
│   ├── league-standings.tsx                # Team management page
│   ├── draft.tsx                  # Live draft interface
│   ├── draft-admin.tsx         # Draft setup page
│   ├── player.page.tsx       # Player detail page
│   ├── api.sheets.ts              # Sheets CRUD API
│   └── api.live-scores.ts         # Server-Sent Events for live updates
├── types/
│   └── index.ts                   # Comprehensive type definitions
└── root.tsx                       # Root layout component
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- Google Cloud Console account
- Google Spreadsheet

### 2. Google Sheets Setup

#### Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google Sheets API
4. Create service account credentials
5. Download JSON key file
6. Base64 encode the JSON: `base64 -i service-account.json`

#### Setup Spreadsheet
1. Create new Google Spreadsheet
2. Share with service account email (from JSON file)
3. Create these sheets with exact names:
    - `Divisions`
    - `UserTeams`
    - `WeeklyPoints`
    - `Draft`
    - `DraftState`
    - `DraftOrder`
    - `PlayerGameweekStats`
    - `PlayerSeasonStats`

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
```

### 4. Installation

This is a Yarn 4 workspace repo — use `yarn`, not `npm`.

```bash
yarn install
```

## Running it locally

There are **two** ways to start the app, and they answer different questions.

### `yarn dev` — the real thing

```bash
yarn dev          # http://localhost:5173
```

Reads live Google Sheets, the live FPL API and your real Firestore. Needs `.env.local`
(see *Environment Variables* below); `yarn dev` syncs it into the workspaces for you.

### `yarn dev:fixtures` — the offline fixture server

```bash
yarn dev:fixtures # http://localhost:3100
```

The same app, served **entirely from `test-fixtures/`**. No credentials, no network, nothing
to set up. On boot it rebuilds the whole season through the app's own pipeline — 117 documents
in about six seconds — into an in-memory Firestore, and serves Sheets and FPL over MSW.

**It takes the date as a URL parameter**, which is the only way to see the site in a state
other than "today":

| URL | what you get |
|---|---|
| `http://localhost:3100/?now=2025-01-10` | mid-season, gameweek 21, cup league stage |
| `http://localhost:3100/?now=2024-08-16` | gameweek 1, before the first deadline |
| `http://localhost:3100/?now=2025-05-26` | after the final deadline, gameweek 38 |
| `http://localhost:3100/?now=clear` | back to real time |

`?now=` sets a cookie, so you set the date once and then click around normally. Two browsers
can sit at two different dates against the same server.

**What it is for.** When the real site 500s there is no way to tell whether the code broke or
the data simply is not there. Here the data is known-good by construction, so: **green here and
red in production means the fault is data, not code.** It changes nothing about the real app —
repopulating real Firestore is what `/admin` is for.

The date parameter only exists on the fixture server. `yarn dev` always runs at the real date.

### Everything else

```bash
yarn local        # firebase emulators
yarn build        # build everything (the only thing that type-checks `functions`)
yarn start        # serve the production build locally (run `yarn build` first)
yarn deploy       # build + firebase deploy
```

> `yarn preview` is currently **broken** — it delegates to a `preview` script in the `draft`
> workspace that does not exist. Use `yarn build && yarn start`.

### Checks

```bash
yarn test         # vitest, including the full season rebuild
yarn ratchet      # type errors / CSS violations / lint warnings must not increase
yarn check:fix    # Biome lint + format
yarn type-check   # tsc on the draft workspace
```

Run `yarn build` before committing — it is the only thing that type-checks the `functions`
workspace, and `yarn test` and `yarn ratchet` never touch it.

## Google Sheets Structure

### Divisions Sheet
| Column | Description |
|--------|-------------|
| ID | Unique division identifier |
| Label | Human-readable division name |
| Order | Sort order for divisions |

### UserTeams Sheet
| Column | Description |
|--------|-------------|
| User ID | Unique user identifier |
| User Name | Manager's display name |
| Team Name | Fantasy team name |
| FPL ID | Fantasy Premier League ID |
| Division ID | Division assignment |
| Current GW Points | Latest gameweek points |
| Total Points | Season total points |
| Overall Rank | FPL overall ranking |
| League Rank | Internal league ranking |
| Last Updated | Timestamp of last update |

### Draft Sheet
| Column | Description |
|--------|-------------|
| Pick Number | Sequential pick number |
| Round | Draft round |
| User ID | User making the pick |
| Player ID | FPL player ID |
| Player Name | Player's full name |
| Team | Player's club team |
| Position | Player position |
| Picked At | Timestamp of pick |
| Division ID | Division conducting draft |

### DraftState Sheet
| Column | Description |
|--------|-------------|
| Is Active | Whether draft is currently active |
| Current Pick | Current pick number |
| Current User ID | User whose turn it is |
| Current Division ID | Division currently drafting |
| Total Rounds | Number of rounds in draft |
| Picks Per Team | Picks each team gets |
| Started At | Draft start timestamp |
| Completed At | Draft completion timestamp |

## Custom Points System

### Position-Based Scoring

#### Goalkeepers (GK)
- Goals: 10 points each
- Clean Sheets: 5 points
- Saves: 1 point per 3 saves (after 2nd save)
- Goals Conceded: -1 point per 2 goals
- Red Cards: -3 points

#### Defenders (FB/CB)
- Goals: 8 points each
- Clean Sheets: 5 points
- Goals Conceded: -1 point per 2 goals
- Red Cards: -3 points

#### Midfielders (MID)
- Goals: 5 points each
- Clean Sheets: 3 points
- Red Cards: -5 points

#### Attackers (WA/CA)
- Goals: 4 points each
- Clean Sheets: 0 points
- Red Cards: -5 points

#### Universal Rules
- Appearance: 1 point (<45 min), 3 points (45+ min)
- Assists: 3 points (all positions)
- Yellow Cards: -1 point (all positions)

## API Endpoints

### Sheets API (`/api/sheets`)
- **GET** `?entity=divisions` - Get all divisions
- **GET** `?entity=userTeams` - Get all user teams
- **GET** `?entity=draftPicks&divisionId=X` - Get draft picks for division
- **POST** `?operation=create&entity=division` - Create division
- **POST** `?operation=update&entity=userTeam` - Update user team
- **POST** `?operation=generateDraftOrder` - Generate random draft order

### Live Updates (`/api/live-scores`)
- **GET** `?division=X` - Server-Sent Events stream for live draft updates
- Events: `draft-update`, `pick-made`, `turn-change`, `draft-complete`

## Development Notes

### Key Design Decisions
- **Header-based Parsing**: Flexible sheet structure, column order independent
- **Single Responsibility**: Each sheet handler manages one entity type
- **Type Safety**: Comprehensive TypeScript interfaces throughout
- **Error Handling**: Robust error boundaries and validation
- **Performance**: Efficient data fetching with parallel requests
- **Real-time**: SSE for live draft updates without polling overhead

### File Organization
- **`/lib/sheets/`**: Individual files per sheet type for maintainability
- **`/lib/points.ts`**: Centralized points calculation logic
- **`/lib/fpl/`**: FPL API integration with caching
- **`/types/`**: Comprehensive type definitions
- **`/routes/`**: Page components and API endpoints

### Custom Points Integration
The points system is fully integrated with player detail pages, showing:
- Real-time calculation using custom rules
- Position-specific breakdown
- Historical gameweek performance
- Season aggregations
- Visual indicators for positive/negative points

## Environment Variables

`.env.local` at the repo root is the single source of truth. It is gitignored — never commit it.

```bash
cp .env.example .env.local
```

`draft/.env` and `functions/.env` are auto-generated from it by `yarn sync-env`, which runs automatically as part of `yarn dev` and `yarn local`. Do not edit them directly.

### Variable reference

#### Google Sheets (server-side only)

| Variable | Description |
|---|---|
| `GOOGLE_SHEETS_ID` | The spreadsheet ID from the Google Sheets URL (`/spreadsheets/d/<ID>/edit`) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Base64-encoded service account JSON for the Google Sheets API. Used to read/write all league data (transfers, draft picks, rosters). |

To encode a service account key file:
```bash
base64 -i ./path/to/service-account.json
```

The service account email (inside the JSON) must have **Editor** access to the spreadsheet.

#### Firebase Admin (server-side only)

| Variable | Description |
|---|---|
| `MY_FIREBASE_SERVICE_ACCOUNT_KEY` | Base64-encoded Firebase Admin SDK service account JSON. Used server-side to read/write Firestore (persistent cache) and interact with Firebase Auth. |
| `MY_FIREBASE_DATABASE_URL` | Firebase Realtime Database URL (e.g. `https://<project>-default-rtdb.europe-west1.firebasedatabase.app/`). Used server-side for draft sync. |

#### Firebase Client (exposed to browser via Vite)

These are prefixed `VITE_` so Vite bundles them into the client. They are not secret — they identify the Firebase project for the client SDK.

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL — also needed client-side for the live draft room |

#### Optional

| Variable | Default | Description |
|---|---|---|
| `FPL_API_DELAY` | `1000` | Milliseconds to wait between FPL API requests when batching player stats. Increase if hitting rate limits. |
| `FIRESTORE_DATABASE_ID` | `draft` | Firestore database ID. The project uses a named database called `draft`, not the Firebase default. |

### Security notes

- `GOOGLE_SERVICE_ACCOUNT_KEY` and `MY_FIREBASE_SERVICE_ACCOUNT_KEY` are full private keys. Treat them like passwords.
- The `VITE_FIREBASE_*` variables are intentionally public — Firebase security rules on the project control what the client can actually access.
- `.env.local` and all derived env files are in `.gitignore`. Verify before committing.

---

## Deployment

### Build & Deploy
```bash
yarn build          # builds draft app + copies to functions + compiles functions
firebase deploy     # deploys hosting + Cloud Functions
```

Or individually:
```bash
firebase deploy --only hosting
firebase deploy --only functions
```

Production environment variables are set in the Firebase project settings (or via `firebase functions:config:set` for legacy config).

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push branch: `git push origin feature/new-feature`
5. Submit pull request

## License

MIT License - see LICENSE file for details.
