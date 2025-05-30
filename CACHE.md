# Cache Logic Summary:

## 🎯 BAU (Business as Usual) Flow

- Current gameweek: Always updates (scores might still be changing)
- Previous gameweek: Updates only if it finished since last cache update
- Older gameweeks: Uses cached data (marked as isFinal)

## 🔄 API Endpoints

- `/api/refresh-cache?token=xxxIncremental` update (BAU flow)
- `/api/refresh-cache?token=xxx&full=true` Full refresh (recalculate everything)
- `/api/refresh-cache?token=xxx&clear=true` Clear all and rebuild from scratch
- `/api/refresh-cache?token=xxx&gameweeks=38,39` Specific gameweeks only

## ⚡ Performance Benefits

- Incremental updates: ~5 seconds instead of 30+ seconds
- Finished gameweeks: 0 API calls (use cache)
- Current gameweek: Only ~100 API calls instead of 3,800
- Storage efficient: Each gameweek cached separately

## 🗂️ Data Structure

```
Firestore Collections:
├── player_stats_cache/
│   ├── _metadata (cache info)
│   └── {playerId} (final calculated stats)
└── gameweek_data_cache/
└── {playerId}-{gameweek} (individual GW data)
```

## 🔧 Smart Logic

- Gameweek finished? → Mark as isFinal, never refetch
- Current gameweek? → Always refetch (scores changing)
- Previous GW just finished? → Update once, then mark final
- Cache hit? → ~200ms response time
- Cache miss? → Fallback to fresh data

## Usage Examples:
From curl/scripts:

```bash
# Check cache status
curl "https://yoursite.com/api/cache?action=status"

# Full refresh
curl "https://yoursite.com/api/cache?action=refresh-full"

# Update specific gameweeks
curl -X POST "https://yoursite.com/api/cache" \
-H "Content-Type: application/json" \
-d '{"action":"refresh-gameweeks","options":{"specificGameweeks":[15,16]}}'
```
