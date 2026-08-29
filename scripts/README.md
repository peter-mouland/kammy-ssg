# Scripts

One-off maintenance scripts run manually at season boundaries. Not part of the build or CI.

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

---

## backup-division-teams.mjs

**Run before any full points regeneration.** The admin "Regenerate points" job with jobType `all` rewrites every `division-teams/{divisionId}_gw{n}` document from FPL data. Reverting a code change restores the scoring rules; it does not restore the documents. This script is the back-out.

### The three steps

```bash
# 1. Before regenerating — dump the live collection
node --env-file=.env.local scripts/backup-division-teams.mjs

# 2. After regenerating — see exactly which managers moved, and by how much
node --env-file=.env.local scripts/backup-division-teams.mjs --compare backups/division-teams-<stamp>.json

# 3. Only if it went wrong — put it back (dry run first, always)
node --env-file=.env.local scripts/backup-division-teams.mjs --restore backups/division-teams-<stamp>.json
node --env-file=.env.local scripts/backup-division-teams.mjs --restore backups/division-teams-<stamp>.json --yes
```

### Flags

| Flag | Effect |
|---|---|
| `--compare <file>` | Diff the live collection against a backup. Read-only. |
| `--restore <file>` | Write a backup back. **Dry run unless `--yes` is also passed.** |
| `--yes` | Actually perform the restore. |
| `--prune` | With `--restore`, also delete live documents absent from the backup. |
| `--verbose` | With `--compare`, print every changed document rather than the latest gameweek per division. |

### Required env vars (in `.env.local`)

| Variable | Purpose |
|---|---|
| `MY_FIREBASE_SERVICE_ACCOUNT_KEY` | Base64-encoded service account JSON. The same one the app uses. |
| `FIRESTORE_DATABASE_ID` | Optional. Defaults to `draft`, matching `firebase.admin.ts`. |

### Notes

- Backups go to `backups/`, which is gitignored. They contain live league data and must never be committed.
- Every run prints the project, database and collection before doing anything. Connecting to the wrong project is the one mistake this script must not let you make quietly.
- `--compare` reports season points per manager (the sum of `season.points.total` across their roster), so a scoring change shows up as a league table delta rather than a JSON diff.
- Restore is a full `set()` per document, batched at 400. It does not delete documents that exist live but not in the backup unless you pass `--prune`.
- A backup refuses to write if the collection comes back empty, so a failed read cannot quietly overwrite a good backup with nothing.
