export { CacheManager } from './cache-manager';
export type {
    CacheDocument,
    FplEndpointDocument,
    PlayerSeasonDocument,
    PlayerGameweekDocument,
    CacheState
} from './types';

// Usage example in your existing data fetching logic:
/*
import { CacheManager } from '@/lib/firestore-cache';

const cacheManager = new CacheManager();

export async function fetchFplDataWithCache<TData>(
  endpoint: string,
  fetcher: () => Promise<TData>
): Promise<TData> {
  // Try to get from cache first
  const cached = await cacheManager.getFplData<TData>(endpoint);
  if (cached) {
    return cached;
  }

  // Fetch from API and cache
  const fresh = await fetcher();
  await cacheManager.cacheFplData(endpoint, fresh);
  return fresh;
}

export async function fetchPlayerSeasonDataWithCache<TData>(
  playerId: number,
  season: string,
  fetcher: () => Promise<TData>
): Promise<TData> {
  const cached = await cacheManager.getPlayerSeasonData<TData>(playerId, season);
  if (cached) {
    return cached;
  }

  const fresh = await fetcher();
  // Assuming fresh data has the structure you need
  await cacheManager.cachePlayerSeasonData(playerId, season, fresh as PlayerSeasonDocument['data']);
  return fresh;
}
*/
