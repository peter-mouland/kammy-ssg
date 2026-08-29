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

# The whole job: find who is new, research them, file the answers
node --env-file=.env.local scripts/new-player-inbox.mjs research
node --env-file=.env.local scripts/new-player-inbox.mjs research --dry      # writes nothing
node --env-file=.env.local scripts/new-player-inbox.mjs research --verbose  # prints the evidence

# Just the diff
node --env-file=.env.local scripts/new-player-inbox.mjs list

# File answers researched some other way
node --env-file=.env.local scripts/new-player-inbox.mjs write researched.json
```

### How a position is decided

No model is involved, and nothing costs anything.

`lib/player-evidence.mjs` fetches three sources in parallel and keeps their disagreement rather
than resolving it. FotMob is the valuable one: it publishes how many times a player lined up in
each slot, plus minutes by competition, so cup and international minutes can be seen rather than
silently folded in. Transfermarkt gives a curated main position and any secondary ones.
Wikipedia confirms the current club, which is what makes the other two trustworthy for a player
who has just moved.

Reachability, tested 29 Aug 2026: FotMob 200 on `/api/data/` paths (the older `/api/` paths
404), Transfermarkt 200, Wikipedia 200. Sofascore 403 on every endpoint and header combination
tried, which costs us the per-match lineup-slot method. FBref 403. Understat no longer serves
embedded JSON. FootballCritic's search is client-rendered.

Search names need a fallback ladder: FotMob returns nothing for "El Hadji Malick Diouf" and
finds him at once as "Malick Diouf".

`lib/classify-position.mjs` then answers by counting. The scoring table allows this: CB and FB
score identically and so do WA and CA, so only the group has to be right, and appearance counts
settle the group for most players. It abstains rather than guessing when appearances are spread
across groups, when the attacking-midfield slot dominates (it spans MID and CA), or when there
is no appearance record. An abstention is still filed, with no position and all of the evidence,
because that is more use to an admin than a guess.

### The diff reads the sheet, not FPL

`FPL_Player_export` is the new-player feed. Nick refreshes it from FPL, and it is the tab the
four formula columns in `Players` look a code up in, so a player who is not in it cannot be
added at all: the row would land `#N/A` in club, value and status, and `isHidden` derives from
an `#N/A` status. Starting from the export means the diff asks the same question Nick answers
by hand, which is what is in the export that is not yet in the game.

FPL is still called, for the one field the export does not carry: `element_type`. That is what
lets the page say "FPL says MID, this says WA", and that crossing is the point of the whole
exercise. If FPL is unreachable the diff still works and the FPL position reads as unknown,
because a day with no suggestions is worse than a day with suggestions missing one column.

`new-players.service.ts` reaches the same set from the other direction, starting at FPL and
filtering by the export. Verified against the live sheet: both produce the same six players, and
there are no codes in the export that FPL has dropped.

### Checking the answers against calls the league has already made

```bash
node --env-file=.env.local scripts/new-player-inbox.mjs sample --size=24 > todo.json
# research those, then
node --env-file=.env.local scripts/new-player-inbox.mjs score researched.json
```

`sample` does not take a random slice of the sheet. GK maps onto GK and FWD maps onto CA with
no judgement involved, and CB and FB score identically, so agreement there is agreement about
nothing. Every call that moves points sits in one place: FPL's midfielders, who the sheet splits
between MID, WA and CA. That is what it samples, plus anywhere the sheet has already crossed a
group boundary FPL did not. It withholds the current position, because researching a player
whose answer you have read is not a test.

`score` reports exact agreement and scoring agreement separately. Only a move between the
defensive, midfield and attacking groups changes anyone's points, so a run that gets every group
right and argues about CB against FB is a good run.

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
