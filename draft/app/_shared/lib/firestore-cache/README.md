## Key Features:

- Modular Architecture: Separate concerns with distinct classes for different cache types
- Incremental Updates: Only fetches/updates outdated documents based on configurable age thresholds
- Concurrency Safety: Prevents race conditions with operation locking mechanism
- Batch Operations: Efficiently handles multiple document requests
- State Awareness: Tracks active operations and update status

## Domain Boundaries:

- FplCache: Handles FPL endpoint responses
- PlayerCache: Manages player season and gameweek data
- CacheStateManager: Prevents concurrent updates
- FirestoreClient: Low-level Firestore operations

# Usage Pattern:
```typescript
// In your existing data fetching logic
const cache = new CacheManager();

// Check cache first, fetch if expired
const fplData = await cache.getFplData('bootstrap-static') ||
await fetchAndCacheFplData('bootstrap-static');

// Batch check for outdated player data
const outdatedPlayers = await cache.getOutdatedPlayerSeasons([
{ playerId: 123, season: '2024-25' },
{ playerId: 456, season: '2024-25' }
]);
Safety Features:

Operation locking prevents simultaneous updates to same document
Batch operations respect Firestore limits
Automatic document/collection creation
Type-safe interfaces throughout
```

You can integrate this gradually - start with FPL endpoint caching, then add player data caching as needed.
Your existing scoring logic remains untouched since this only caches the raw and enhanced data.
