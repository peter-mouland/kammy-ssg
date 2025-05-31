// app/lib/server/cache/storage.ts - REPLACE YOUR EXISTING FILE

import { getFirestoreInstance } from '../../lib/firebase.admin';
import { getFplBootstrapData } from "../fpl/api";
import type { FplTeamData } from "../../types";
import type {
    CacheMetadata,
    PlayerStatsData,
    EnhancedPlayerData
} from './types';
import { timestampToDate } from './utils';
import { getSeasonStats } from './season-stats';
import { CACHE_VERSION, CACHE_STATUS_COLLECTION } from './constants';

const db = getFirestoreInstance();

export async function getCacheMetadata(): Promise<CacheMetadata | null> {
    try {
        const metadataDoc = await db.collection(CACHE_STATUS_COLLECTION).doc('_metadata').get();

        if (!metadataDoc.exists) {
            return null;
        }

        return metadataDoc.data() as CacheMetadata;
    } catch (error) {
        console.error('Error getting cache metadata:', error);
        return null;
    }
}

export async function isCacheValid(metadata: CacheMetadata | null): Promise<boolean> {
    if (!metadata) return false;

    // Check if cache version matches
    if (metadata.version !== CACHE_VERSION) {
        console.log('Cache version mismatch, invalidating cache');
        return false;
    }

    try {
        const bootstrapData = await getFplBootstrapData();
        const currentGameweek = bootstrapData.events.find(event => event.is_current)?.id || 1;

        // Convert Firestore Timestamp to JavaScript Date
        const lastUpdatedDate = timestampToDate(metadata.lastUpdated);

        // If current gameweek has changed since cache was created, cache needs update
        if (metadata.currentGameweek !== currentGameweek) {
            console.log(`Current gameweek has changed from ${metadata.currentGameweek} to ${currentGameweek}, cache needs update`);
            return false;
        }

        // For current gameweek data, check if cache is too old (more than 4 hours)
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        if (lastUpdatedDate < fourHoursAgo) {
            console.log(`Cache is older than 4 hours (cache: ${lastUpdatedDate.toISOString()}, threshold: ${fourHoursAgo.toISOString()}), considering refresh for live data`);
            return false;
        }

        console.log(`Cache is valid (last updated: ${lastUpdatedDate.toISOString()})`);
        return true;
    } catch (error) {
        console.error('Error validating cache:', error);
        return false;
    }
}


// Removed getCachedGameweekData - now handled by gameweek-storage.ts
// Removed cacheGameweekData - now handled by gameweek-storage.ts
// Removed clearAllCache - now handled by lifecycle.ts
