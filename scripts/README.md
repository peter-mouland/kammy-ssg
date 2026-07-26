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
