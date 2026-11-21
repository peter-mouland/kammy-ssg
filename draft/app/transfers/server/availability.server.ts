/* Location: app/transfers/server/availability.server.ts */

import { CACHE_KEYS } from '../../_shared/lib/cache/cache-config';
import { dataCache } from '../../_shared/lib/cache/data-cache.service';
import { fplApiCache } from '../../_shared/lib/fpl/api-cache';
import { type AvailabilitySnapshot, buildAvailabilityByCode } from '../lib/player-availability';

/**
 * The oldest copy of FPL's availability worth showing. `dataCache` hands back its last copy,
 * however old, when a refresh fails -- and FPL is often down for a while after a deadline,
 * which is exactly when managers are looking. Wrong news is worse than none, so past this
 * the page says availability can't be shown rather than showing a stale copy as current.
 */
export const MAX_AVAILABILITY_AGE_MS = 6 * 60 * 60 * 1000;

/**
 * FPL's injury and suspension status for every player in doubt, from the live bootstrap
 * (refreshed at most hourly, and only when someone opens the transfers page). Never throws:
 * `null` means "can't say right now", and the page carries on without it.
 */
export async function loadAvailability(): Promise<AvailabilitySnapshot | null> {
    try {
        const bootstrap = await fplApiCache.getFplBootstrap();
        const age = dataCache.getCacheInfo(CACHE_KEYS.FPL.BOOTSTRAP).age ?? 0;
        if (age > MAX_AVAILABILITY_AGE_MS) {
            console.warn(`FPL availability is ${Math.round(age / 60000)} minutes old; not showing it`);
            return null;
        }
        return {
            byCode: buildAvailabilityByCode(bootstrap.elements),
            fetchedAt: new Date(Date.now() - age).toISOString(),
        };
    } catch (error) {
        console.error('Failed to load FPL availability:', error);
        return null;
    }
}
