// app/lib/server/cache/gameweek-storage.ts

import { getFirestoreInstance } from '../../lib/firebase.admin';
import { CACHE_VERSION } from './constants';
import { setSeasonStats, type SeasonStats } from './season-stats';

const db = getFirestoreInstance();
const GAMEWEEK_DATA_COLLECTION = 'gameweek_data';
const AGGREGATION_META_COLLECTION = 'aggregation_meta';

export interface GameweekData {
    playerId: number;
    gameweek: number;
    points: number;
    stats: {
        minutesPlayed: number;
        goals: number;
        assists: number;
        cleanSheets: number;
        goalsConceded: number;
        saves: number;
        bonus: number;
        yellowCards: number;
        redCards: number;
        penaltiesSaved: number;
    };
    pointsBreakdown: {
        minutesPlayed: number;
        goals: number;
        assists: number;
        cleanSheets: number;
        goalsConceded: number;
        saves: number;
        bonus: number;
        yellowCards: number;
        redCards: number;
        penaltiesSaved: number;
        total: number;
    };
    // Metadata
    isFinal: boolean;
    updatedAt: Date;
    cache_version: string;
}

export interface AggregationMeta {
    playerId: number;
    processedGameweeks: number[];
    lastUpdated: Date;
    totalGameweeks: number;
    seasonStats: Omit<SeasonStats, 'playerId' | 'season' | 'updatedAt' | 'cache_version'>;
}

// Updated function to handle multiple games in a gameweek
export async function updateGameweekData(
    playerId: number,
    gameweek: number,
    pointsBreakdown: GameweekData['pointsBreakdown'],
    stats: GameweekData['pointsBreakdown'],
    isFinal: boolean = false
): Promise<void> {
    const batch = db.batch();

    // Create complete gameweek document with aggregated data
    const gameweekRef = db.collection(GAMEWEEK_DATA_COLLECTION).doc(`${playerId}_${gameweek}`);
    const gameweekData: GameweekData = {
        playerId,
        gameweek,
        points: pointsBreakdown.total,
        stats,
        pointsBreakdown,
        isFinal,
        updatedAt: new Date(),
        cache_version: CACHE_VERSION
    };

    batch.set(gameweekRef, gameweekData);
    await batch.commit();

    // Update season stats incrementally
    await updateSeasonStatsIncremental(playerId, gameweek, gameweekData);
}

export async function updateSeasonStatsIncremental(
    playerId: number,
    gameweek: number,
    newGameweekData: GameweekData
): Promise<void> {
    const aggregationRef = db.collection(AGGREGATION_META_COLLECTION).doc(playerId.toString());

    await db.runTransaction(async (transaction) => {
        const aggregationDoc = await transaction.get(aggregationRef);
        const currentMeta = aggregationDoc.exists ? aggregationDoc.data() as AggregationMeta : {
            playerId,
            processedGameweeks: [],
            lastUpdated: new Date(),
            totalGameweeks: 0,
            seasonStats: {
                totalMinutes: 0,
                gamesPlayed: 0, // This is now gameweeks with minutes > 0
                goals: 0,
                assists: 0,
                cleanSheets: 0,
                goalsConceded: 0,
                penaltiesSaved: 0,
                yellowCards: 0,
                redCards: 0,
                saves: 0,
                bonus: 0,
                totalPoints: 0,
                totalGamesPlayed: 0 // Add this for actual games count
            }
        };

        // Check if this gameweek was already processed
        const processedGameweeks = new Set(currentMeta.processedGameweeks || []);
        const isUpdate = processedGameweeks.has(gameweek);

        let updatedSeasonStats = { ...currentMeta.seasonStats };

        if (isUpdate) {
            // Get old gameweek data to subtract it first
            const oldGameweekRef = db.collection(GAMEWEEK_DATA_COLLECTION).doc(`${playerId}_${gameweek}`);
            const oldGameweekDoc = await transaction.get(oldGameweekRef);

            if (oldGameweekDoc.exists) {
                const oldData = oldGameweekDoc.data() as GameweekData;
                updatedSeasonStats = subtractStats(updatedSeasonStats, oldData);
            }
        }

        // Add new values
        updatedSeasonStats = addStats(updatedSeasonStats, newGameweekData);
        processedGameweeks.add(gameweek);

        // Update aggregation meta
        transaction.set(aggregationRef, {
            playerId,
            processedGameweeks: Array.from(processedGameweeks),
            lastUpdated: new Date(),
            totalGameweeks: processedGameweeks.size,
            seasonStats: updatedSeasonStats
        });

        // Update season stats collection (simple totals only)
        const seasonStatsData: SeasonStats = {
            playerId,
            season: '2024-25',
            ...updatedSeasonStats,
            updatedAt: new Date(),
            cache_version: CACHE_VERSION
        };

        setImmediate(() => setSeasonStats(seasonStatsData));
    });
}

export async function getGameweekPlayerData(playerIds: number[], gameweek: number): Promise<GameweekData[]> {
    return optimizedGameweekQuery(playerIds, [gameweek]);
}

export async function getGameweekPlayerDataRange(playerIds: number[], gameweeks: number[]): Promise<GameweekData[]> {
    return optimizedGameweekQuery(playerIds, gameweeks);
}

// Calculate season points breakdown from gameweek data (on-demand)
export async function getSeasonPointsBreakdown(playerId: number) {
    const gameweekDocs = await db.collection(GAMEWEEK_DATA_COLLECTION)
        .where('playerId', '==', playerId)
        .where('cache_version', '==', CACHE_VERSION)
        .orderBy('gameweek')
        .get();

    const breakdown = {
        //
        minutesPlayed: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        goalsConceded: 0,
        saves: 0,
        bonus: 0,
        yellowCards: 0,
        redCards: 0,
        penaltiesSaved: 0,
        //
        total: 0,
    };
    const stats = {
        //
        minutesPlayed: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        goalsConceded: 0,
        saves: 0,
        bonus: 0,
        yellowCards: 0,
        redCards: 0,
        penaltiesSaved: 0,
    };

    gameweekDocs.docs.forEach(doc => {
        const data = doc.data() as GameweekData;

        // Aggregate totals
        breakdown.total += data.pointsBreakdown.total;
        breakdown.minutesPlayed += data.pointsBreakdown.minutesPlayed;
        breakdown.goals += data.pointsBreakdown.goals;
        breakdown.assists += data.pointsBreakdown.assists;
        breakdown.cleanSheets += data.pointsBreakdown.cleanSheets;
        breakdown.goalsConceded += data.pointsBreakdown.goalsConceded;
        breakdown.saves += data.pointsBreakdown.saves;
        breakdown.bonus += data.pointsBreakdown.bonus;
        breakdown.yellowCards += data.pointsBreakdown.yellowCards;
        breakdown.redCards += data.pointsBreakdown.redCards;
        breakdown.penaltiesSaved += data.pointsBreakdown.penaltiesSaved;
        // Aggregate totals
        stats.minutesPlayed += data.stats.minutesPlayed;
        stats.goals += data.stats.goals;
        stats.assists += data.stats.assists;
        stats.cleanSheets += data.stats.cleanSheets;
        stats.goalsConceded += data.stats.goalsConceded;
        stats.saves += data.stats.saves;
        stats.bonus += data.stats.bonus;
        stats.yellowCards += data.stats.yellowCards;
        stats.redCards += data.stats.redCards;
        stats.penaltiesSaved += data.stats.penaltiesSaved;

    });

    return { breakdown, stats };
}

// Smart query strategy (same as before)
async function optimizedGameweekQuery(playerIds: number[], gameweeks: number[]): Promise<GameweekData[]> {
    const totalQueries = Math.ceil(playerIds.length / 30) * gameweeks.length;

    if (totalQueries > 20) {
        return collectionScanApproach(playerIds, gameweeks);
    }

    return batchQueryApproach(playerIds, gameweeks);
}

async function collectionScanApproach(playerIds: number[], gameweeks: number[]): Promise<GameweekData[]> {
    const results: GameweekData[] = [];
    const playerSet = new Set(playerIds);
    const gameweekSet = new Set(gameweeks);

    const snapshot = await db.collection(GAMEWEEK_DATA_COLLECTION)
        .where('cache_version', '==', CACHE_VERSION)
        .where('gameweek', 'in', gameweeks.slice(0, 10))
        .get();

    snapshot.docs.forEach(doc => {
        const data = doc.data() as GameweekData;
        if (playerSet.has(data.playerId) && gameweekSet.has(data.gameweek)) {
            results.push(data);
        }
    });

    return results;
}

async function batchQueryApproach(playerIds: number[], gameweeks: number[]): Promise<GameweekData[]> {
    const results: GameweekData[] = [];

    for (const gameweek of gameweeks) {
        const batches = [];
        for (let i = 0; i < playerIds.length; i += 30) {
            batches.push(playerIds.slice(i, i + 30));
        }

        const batchPromises = batches.map(batch =>
            db.collection(GAMEWEEK_DATA_COLLECTION)
                .where('playerId', 'in', batch)
                .where('gameweek', '==', gameweek)
                .where('cache_version', '==', CACHE_VERSION)
                .get()
        );

        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
                results.push(doc.data() as GameweekData);
            });
        });
    }

    return results;
}

export async function clearGameweekData(): Promise<void> {
    const collections = [GAMEWEEK_DATA_COLLECTION, AGGREGATION_META_COLLECTION];

    for (const collection of collections) {
        const BATCH_SIZE = 250;
        let deletedCount = 0;

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

            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`Cleared ${collection}: ${deletedCount} documents`);
    }
}

export async function cleanupOldGameweeks(currentGameweek: number): Promise<void> {
    const cutoffGameweek = currentGameweek - 3;
    if (cutoffGameweek <= 0) return;

    const BATCH_SIZE = 250;
    let totalDeleted = 0;

    while (true) {
        const oldDocs = await db.collection(GAMEWEEK_DATA_COLLECTION)
            .where('gameweek', '<', cutoffGameweek)
            .limit(BATCH_SIZE)
            .get();

        if (oldDocs.empty) break;

        const batch = db.batch();
        oldDocs.docs.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        totalDeleted += oldDocs.docs.length;

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (totalDeleted > 0) {
        console.log(`Cleaned up ${totalDeleted} old gameweek documents`);
    }
}

// Helper functions - now include points and handle multiple games
function addStats(existing: any, toAdd: GameweekData['stats']): any {
    const result = { ...existing };
    const numericFields = [
        'goals', 'assists', 'cleanSheets', 'goalsConceded', 'points', 'minutesPlayed',
        'penaltiesSaved', 'yellowCards', 'redCards', 'saves', 'bonus'
    ];

    numericFields.forEach(field => {
        if (toAdd[field] !== undefined) {
            result[field] = (result[field] || 0) + toAdd[field];
        }
    });

    // Handle minutes, gameweeks played, actual games played, and points
    result.totalMinutes = (result.totalMinutes || 0) + (toAdd.minutesPlayed || 0);
    result.totalPoints = (result.totalPoints || 0) + (toAdd.points || 0);
    result.totalGamesPlayed = (result.totalGamesPlayed || 0) + (toAdd.gamesPlayed || 0);

    // gamesPlayed in season stats = gameweeks where player played (had minutes > 0)
    if (toAdd.minutesPlayed > 0) {
        result.gamesPlayed = (result.gamesPlayed || 0) + 1;
    }

    return result;
}

function subtractStats(existing: any, toSubtract: GameweekData): any {
    const result = { ...existing };
    const numericFields = [
        'goals', 'assists', 'cleanSheets', 'goalsConceded', 'points', 'minutesPlayed',
        'penaltiesSaved', 'yellowCards', 'redCards', 'saves', 'bonus'
    ];

    numericFields.forEach(field => {
        if (toSubtract[field] !== undefined) {
            result[field] = (result[field] || 0) - toSubtract[field];
        }
    });

    // Handle minutes, gameweeks played, actual games played, and points
    result.totalMinutes = (result.totalMinutes || 0) - (toSubtract.minutesPlayed || 0);
    result.totalPoints = (result.totalPoints || 0) - (toSubtract.points || 0);
    result.totalGamesPlayed = Math.max(0, (result.totalGamesPlayed || 0) - (toSubtract.gamesPlayed || 0));

    // gamesPlayed in season stats = gameweeks where player played
    if (toSubtract.minutesPlayed > 0) {
        result.gamesPlayed = Math.max(0, (result.gamesPlayed || 0) - 1);
    }

    return result;
}
