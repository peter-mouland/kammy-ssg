# Scripts

Maintenance scripts run outside the app. Not part of the build or CI.

---

## new-player-inbox.mjs

The plumbing behind `/admin/new-players`. Works out which FPL players still need a position
researched, and writes the answers into the `PlayerInbox` tab that the admin page reads.

The research itself is not in here. Deciding where a footballer actually plays is a judgement,
so it is done by a scheduled Claude agent that calls `list`, researches each player, then calls
`write`. Splitting it this way keeps the sheet ranges, column order and encoding in one place
and leaves the agent only having to produce an opinion.

This script never writes to `Players`. Letting a player into the game is a decision an admin
takes on the page, after the weekly batch has been announced.

### Usage

```bash
# Create the PlayerInbox tab. Run once, deliberately.
node --env-file=.env.local scripts/new-player-inbox.mjs init

# Who needs researching, and why anyone is being held back
node --env-file=.env.local scripts/new-player-inbox.mjs list
node --env-file=.env.local scripts/new-player-inbox.mjs list --json > todo.json

# Put the answers back
node --env-file=.env.local scripts/new-player-inbox.mjs write researched.json
```

### The candidate list is narrower than "in FPL, not in the sheet"

Four of the eight columns in `Players` are VLOOKUPs into `FPL_Player_export`. Adding a row for a
code that tab does not carry yet writes `#N/A` into club, value and status, and `isHidden` then
derives from an `#N/A` status. The export is refreshed on its own schedule and runs behind the
FPL API, so players it has not seen are held back and reported rather than offered.
`new-players.service.ts` applies the same rule. Change one, change the other.

### The shape `write` expects

```json
[
  {
    "code": 119090,
    "suggested": "MID",
    "confidence": "high",
    "basis": "record",
    "summary": "Central midfield in every sampled start.",
    "reasoning": ["Slot 6 of a 4-2-3-1 in 5 of 5 sampled starts.", "Never started wide."],
    "sources": [{ "label": "Sofascore lineups", "url": "https://..." }]
  }
]
```

`name`, `club`, `fplType` and the timestamp are filled in from FPL rather than taken from the
file, so the agent cannot get them wrong. Everything is validated before anything is written,
and a single bad row means nothing is written at all.

---

## fetch-season-fixtures.mjs

**Run once at the end of each season** to snapshot all FPL and Google Sheets data for that season. The output is committed to the repo and used to power historical player views (`/players/:playerCode?source=<season>`).

### What it saves

| Data | Location |
|---|---|
| FPL bootstrap (players, teams, events) | `draft/app/api/fixtures/<season>/fpl/bootstrap-static.json` |
| FPL fixtures | `draft/app/api/fixtures/<season>/fpl/fixtures.json` |
| FPL player detail (one file per player) | `draft/app/api/fixtures/<season>/fpl/element-summary/<id>.json` |
| Every Google Sheet tab (raw values) | `draft/app/api/fixtures/<season>/spreadsheets/<TabName>.json` |

### Usage

```bash
# Full fetch — FPL + all Sheets tabs
node --env-file=.env.local scripts/fetch-season-fixtures.mjs 2526

# Sheets only (FPL data already fetched)
node --env-file=.env.local scripts/fetch-season-fixtures.mjs 2526 --sheets-only

# FPL only
node --env-file=.env.local scripts/fetch-season-fixtures.mjs 2526 --fpl-only
```

### Required env vars (in `.env.local`)

| Variable | Purpose |
|---|---|
| `GOOGLE_SHEETS_ID` | The spreadsheet ID to snapshot |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Base64-encoded service account JSON (read-only access is sufficient) |
| `FPL_API_DELAY` | Optional. Milliseconds between element-summary requests (default: 200) |

### Notes

- The FPL element-summary fetch is the slow part — ~700 players at 200ms each takes ~2–3 minutes. Increase `FPL_API_DELAY` if you hit rate limits.
- All Sheets tabs are fetched automatically from the spreadsheet metadata — no hardcoded tab names.
- Tabs that return no data still produce a valid JSON file with an empty `values` array.
- Run `--sheets-only` freely throughout the season to refresh transfer and points snapshots.
