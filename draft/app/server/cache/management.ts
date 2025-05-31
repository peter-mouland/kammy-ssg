
// 5. NEW: Cache management utilities
// app/lib/server/cache/management.ts

import { getFirestoreInstance } from '../../lib/firebase.admin';
import {
    SEASON_STATS_COLLECTION,
    GAMEWEEK_DATA_COLLECTION,
    AGGREGATION_META_COLLECTION
} from './constants';

const db = getFirestoreInstance();

export interface CacheStats {
    seasonStats: number;
    gameweekData: number;
    aggregationMeta: number;
    totalDocuments: number;
    estimatedSize: string;
}

export async function getCacheStats(): Promise<CacheStats> {
    const [seasonStatsCount, gameweekDataCount, aggregationMetaCount] = await Promise.all([
        db.collection(SEASON_STATS_COLLECTION).count().get(),
        db.collection(GAMEWEEK_DATA_COLLECTION).count().get(),
        db.collection(AGGREGATION_META_COLLECTION).count().get()
    ]);

    const seasonStats = seasonStatsCount.data().count;
    const gameweekData = gameweekDataCount.data().count;
    const aggregationMeta = aggregationMetaCount.data().count;
    const totalDocuments = seasonStats + gameweekData + aggregationMeta;

    // Rough size estimation (each document ~1-2KB)
    const estimatedSizeKB = totalDocuments * 1.5;
    const estimatedSize = estimatedSizeKB > 1024
        ? `${(estimatedSizeKB / 1024).toFixed(2)} MB`
        : `${estimatedSizeKB.toFixed(0)} KB`;

    return {
        seasonStats,
        gameweekData,
        aggregationMeta,
        totalDocuments,
        estimatedSize
    };
}

export async function clearCacheCollection(collection: string): Promise<number> {
    let deletedCount = 0;
    const BATCH_SIZE = 250;

    while (true) {
        const snapshot = await db.collection(collection).limit(BATCH_SIZE).get();

        if (snapshot.empty) {
            break;
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += snapshot.docs.length;

        console.log(`Deleted ${snapshot.docs.length} documents from ${collection} (total: ${deletedCount})`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return deletedCount;
}

export async function clearAllOptimizedCache(): Promise<void> {
    console.log('Clearing all optimized cache collections...');

    const collections = [
        SEASON_STATS_COLLECTION,
        GAMEWEEK_DATA_COLLECTION,
        AGGREGATION_META_COLLECTION
    ];

    const results = await Promise.all(
        collections.map(collection => clearCacheCollection(collection))
    );

    const totalDeleted = results.reduce((sum, count) => sum + count, 0);
    console.log(`Cleared optimized cache: ${totalDeleted} total documents`);
}
