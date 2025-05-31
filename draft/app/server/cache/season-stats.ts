// app/lib/server/cache/season-stats.ts

import { getFirestoreInstance } from '../../lib/firebase.admin';
import { CACHE_VERSION } from './constants';

const db = getFirestoreInstance();
const SEASON_STATS_COLLECTION = 'season_stats';

export interface SeasonStats {
    playerId: number;
    season: string;
    // Raw stat totals
    totalMinutes: number;
    gamesPlayed: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    penaltiesSaved: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    bonus: number;
    // Points total only (breakdown calculated on-demand from gameweeks)
    totalPoints: number;
    // Metadata
    updatedAt: Date;
    cache_version: string;
}

// In-memory cache to reduce Firestore reads
class SeasonStatsCache {
    private cache = new Map<string, { data: Map<number, SeasonStats>, expiry: number }>();
    private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

    async getSeasonStats(playerIds: number[]): Promise<Map<number, SeasonStats>> {
        const cacheKey = playerIds.sort().join(',');
        const cached = this.cache.get(cacheKey);
        const now = Date.now();

        if (cached && cached.expiry > now) {
            return cached.data;
        }

        const statsMap = await this.fetchFromFirestore(playerIds);
        this.cache.set(cacheKey, { data: statsMap, expiry: now + this.CACHE_TTL });

        return statsMap;
    }

    private async fetchFromFirestore(playerIds: number[]): Promise<Map<number, SeasonStats>> {
        const statsMap = new Map<number, SeasonStats>();

        if (playerIds.length === 0) return statsMap;

        // Batch requests for season stats only
        const batches = [];
        for (let i = 0; i < playerIds.length; i += 30) {
            batches.push(playerIds.slice(i, i + 30));
        }

        const batchPromises = batches.map(batch =>
            db.collection(SEASON_STATS_COLLECTION)
                .where('playerId', 'in', batch)
                .where('cache_version', '==', CACHE_VERSION)
                .get()
        );

        const results = await Promise.all(batchPromises);

        results.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
                const data = doc.data() as SeasonStats;
                statsMap.set(data.playerId, data);
            });
        });

        return statsMap;
    }

    clearCache(): void {
        this.cache.clear();
    }
}

// Global cache instance
const seasonStatsCache = new SeasonStatsCache();

export async function getSeasonStats(playerIds: number[]): Promise<Map<number, SeasonStats>> {
    return seasonStatsCache.getSeasonStats(playerIds);
}

export async function setSeasonStats(seasonStats: SeasonStats): Promise<void> {
    const docRef = db.collection(SEASON_STATS_COLLECTION).doc(seasonStats.playerId.toString());
    await docRef.set(seasonStats);

    // Clear cache for this player
    seasonStatsCache.clearCache();
}

export async function updateSeasonStats(playerId: number, updates: Partial<SeasonStats>): Promise<void> {
    const docRef = db.collection(SEASON_STATS_COLLECTION).doc(playerId.toString());
    await docRef.update({
        ...updates,
        updatedAt: new Date()
    });

    // Clear cache
    seasonStatsCache.clearCache();
}

export async function clearSeasonStats(): Promise<void> {
    const BATCH_SIZE = 250;
    let deletedCount = 0;

    while (true) {
        const snapshot = await db.collection(SEASON_STATS_COLLECTION).limit(BATCH_SIZE).get();

        if (snapshot.empty) {
            break;
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += snapshot.docs.length;

        console.log(`Deleted ${snapshot.docs.length} season stats documents (total: ${deletedCount})`);

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Clear cache
    seasonStatsCache.clearCache();
    console.log(`Cleared all season stats: ${deletedCount} documents`);
}
