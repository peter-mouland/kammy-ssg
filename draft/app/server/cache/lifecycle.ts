// app/lib/server/cache/lifecycle.ts

import { getFirestoreInstance } from '../../lib/firebase.admin';
import { clearSeasonStats } from './season-stats';
import { clearGameweekData } from './gameweek-storage';

const db = getFirestoreInstance();
const SEASON_STATS_COLLECTION = 'season_stats';
const GAMEWEEK_DATA_COLLECTION = 'gameweek_data';
const AGGREGATION_META_COLLECTION = 'aggregation_meta';

export interface CacheStats {
    seasonStats: number;
    gameweekData: number;
    aggregationMeta: number;
    totalDocuments: number;
    estimatedSize: string;
    warnings: string[];
    critical: boolean;
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

    // Generate warnings and check for critical issues
    const warnings: string[] = [];
    let critical = false;

    // Gameweek data shouldn't exceed reasonable limits (500 players * 15 gameweeks = 7.5k docs)
    const maxGameweekDocs = 500 * 15;
    if (gameweekData > maxGameweekDocs) {
        warnings.push(`Gameweek documents (${gameweekData}) exceed recommended limit (${maxGameweekDocs})`);
        if (gameweekData > maxGameweekDocs * 1.5) {
            critical = true;
        }
    }

    // Total document warning
    if (totalDocuments > 25000) {
        warnings.push(`Total documents (${totalDocuments}) approaching large collection size`);
        if (totalDocuments > 50000) {
            critical = true;
        }
    }

    // Efficiency check
    if (gameweekData > seasonStats * 30) {
        warnings.push('Consider more aggressive cleanup - too many gameweek documents per player');
    }

    return {
        seasonStats,
        gameweekData,
        aggregationMeta,
        totalDocuments,
        estimatedSize,
        warnings,
        critical
    };
}

export async function getCollectionStats() {
    const collections = [SEASON_STATS_COLLECTION, GAMEWEEK_DATA_COLLECTION, AGGREGATION_META_COLLECTION];

    for (const collection of collections) {
        const snapshot = await db.collection(collection).count().get();
        console.log(`${collection}: ${snapshot.data().count} documents`);
    }
}

export async function clearAllCache(): Promise<void> {
    console.log('Clearing all cache collections...');

    await Promise.all([
        clearSeasonStats(),
        clearGameweekData()
    ]);

    console.log('All cache collections cleared');
}

// Archive old seasons instead of deleting them
export async function archiveOldSeasons(): Promise<void> {
    const currentSeason = '2024-25';
    const archiveCollection = 'archived_season_stats';

    const oldSeasonDocs = await db.collection(SEASON_STATS_COLLECTION)
        .where('season', '!=', currentSeason)
        .get();

    if (oldSeasonDocs.empty) {
        console.log('No old seasons to archive');
        return;
    }

    const batch = db.batch();
    oldSeasonDocs.docs.forEach(doc => {
        const archiveRef = db.collection(archiveCollection).doc(doc.id);
        batch.set(archiveRef, { ...doc.data(), archivedAt: new Date() });
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Archived ${oldSeasonDocs.docs.length} old season documents`);
}

// Health monitoring
export interface HealthReport {
    status: 'healthy' | 'warning' | 'critical';
    metrics: CacheStats;
    recommendations: string[];
    timestamp: string;
}

export async function getHealthReport(): Promise<HealthReport> {
    const stats = await getCacheStats();
    const recommendations: string[] = [];

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (stats.critical) {
        status = 'critical';
        recommendations.push('🚨 IMMEDIATE ACTION: Document count too high');
        recommendations.push('Run cleanup: clearAllCache() or reduce retention period');
        recommendations.push('Consider archiving old seasons');
    } else if (stats.warnings.length > 0) {
        status = 'warning';
        recommendations.push('⚠️ Schedule regular cleanup');
        recommendations.push('Monitor query costs');
        recommendations.push('Consider reducing gameweek retention to 3');
    }

    // Efficiency recommendations
    if (stats.gameweekData > stats.seasonStats * 20) {
        recommendations.push('📊 Increase cleanup frequency');
    }

    if (stats.totalDocuments > 15000) {
        recommendations.push('🔄 Run daily cleanup jobs');
    }

    if (recommendations.length === 0) {
        recommendations.push('✅ Cache is operating efficiently');
        recommendations.push('📈 Document counts are within optimal range');
    }

    return {
        status,
        metrics: stats,
        recommendations,
        timestamp: new Date().toISOString()
    };
}
