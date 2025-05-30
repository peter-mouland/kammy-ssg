import { getFirestoreInstance } from '../../lib/firebase.admin';
import { getFplBootstrapData } from "../fpl/api";
import type { FplTeamData } from "../../types";
import type {
    CacheMetadata,
    PlayerStatsData,
    CachedPlayerData,
    PlayerGameweekCache,
    EnhancedPlayerData
} from './types';
import {
    CACHE_COLLECTION,
    CACHE_VERSION,
    timestampToDate
} from './utils';

const db = getFirestoreInstance();

export async function getCacheMetadata(): Promise<CacheMetadata | null> {
    try {
        const metadataDoc = await db.collection(CACHE_COLLECTION).doc('_metadata').get();

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
        const currentGameweekEvent = bootstrapData.events.find(event => event.id === currentGameweek);

        // Convert Firestore Timestamp to JavaScript Date
        const lastUpdatedDate = timestampToDate(metadata.lastUpdated);

        // If current gameweek has changed since cache was created, cache needs update
        if (metadata.currentGameweek !== currentGameweek) {
            console.log(`Current gameweek has changed from ${metadata.currentGameweek} to ${currentGameweek}, cache needs update`);
            return false;
        }

        // Check if we're in a new gameweek but haven't updated cache yet
        if (currentGameweekEvent?.deadline_time) {
            const gameweekStartTime = new Date(currentGameweekEvent.deadline_time);

            // If cache was created before this gameweek started, it needs updating
            if (lastUpdatedDate < gameweekStartTime) {
                console.log(`Cache was created before current gameweek ${currentGameweek} started (cache: ${lastUpdatedDate.toISOString()}, gameweek start: ${gameweekStartTime.toISOString()}), needs update`);
                return false;
            }
        }

        // For current gameweek data, check if cache is too old (more than 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (lastUpdatedDate < oneHourAgo) {
            console.log(`Cache is older than 1 hour (cache: ${lastUpdatedDate.toISOString()}, threshold: ${oneHourAgo.toISOString()}), considering refresh for live data`);
            return false;
        }

        // Check if previous gameweek finished since our last cache update
        if (currentGameweek > 1) {
            const previousGameweek = currentGameweek - 1;
            const previousGameweekEvent = bootstrapData.events.find(event => event.id === previousGameweek);

            if (previousGameweekEvent?.finished &&
                !previousGameweekEvent.is_current &&
                !metadata.gameweeksProcessed.includes(previousGameweek)) {
                console.log(`Previous gameweek ${previousGameweek} finished but not marked as final in cache`);
                return false;
            }
        }

        console.log(`Cache is valid (last updated: ${lastUpdatedDate.toISOString()})`);
        return true;
    } catch (error) {
        console.error('Error validating cache:', error);
        return false;
    }
}

export async function getCachedPlayerStatsData(): Promise<PlayerStatsData | null> {
    try {
        const metadata = await getCacheMetadata();

        if (!metadata || !(await isCacheValid(metadata))) {
            return null;
        }

        console.log('Loading player data from cache...');

        // Get cached player data
        const playersSnapshot = await db.collection(CACHE_COLLECTION)
            .where('cache_version', '==', CACHE_VERSION)
            .limit(1000)
            .get();

        if (playersSnapshot.empty) {
            console.log('No cached player data found');
            return null;
        }

        const players = playersSnapshot.docs.map(doc => {
            const data = doc.data() as CachedPlayerData;

            // Debug logging to see what we're getting from cache
            console.log(`Cached player ${data.web_name}: position_name="${data.position_name}"`);

            // Convert cached gameweeks back to gameweek_data array
            const gameweek_data = Object.keys(data.gameweeks || {})
                .sort((a, b) => Number(a) - Number(b))
                .map(gw => data.gameweeks[gw].data);

            // Remove cache-specific fields and create clean player data
            const { cached_at, cache_version, gameweeks, ...playerData } = data;

            const enhancedPlayer: EnhancedPlayerData = {
                ...playerData,
                gameweek_data
            };

            // Debug logging to see what we're returning
            console.log(`Enhanced player ${enhancedPlayer.web_name}: position_name="${enhancedPlayer.position_name}"`);

            return enhancedPlayer;
        });

        // Get teams data (always fetch fresh as it's lightweight)
        const bootstrapData = await getFplBootstrapData();
        const teams = bootstrapData.teams.reduce((acc: Record<number, string>, team: FplTeamData) => {
            acc[team.id] = team.name;
            return acc;
        }, {});

        console.log(`Loaded ${players.length} players from cache`);

        return {
            players: players.filter((p) => p.position_name),
            teams,
            positions: {
                'gk': 'gk',
                'cb': 'cb',
                'fb': 'fb',
                'mid': 'mid',
                'wa': 'wa',
                'ca': 'ca'
            }
        };
    } catch (error) {
        console.error('Error loading cached player data:', error);
        return null;
    }
}

export async function cachePlayerStatsData(data: PlayerStatsData, currentGameweek: number): Promise<void> {
    try {
        console.log('Caching player stats data...');

        const timestamp = new Date();
        // Even smaller batch size due to very large documents
        const BATCH_SIZE = 25; // Conservative batch size

        // Chunk players into smaller batches
        const playerChunks = [];
        for (let i = 0; i < data.players.length; i += BATCH_SIZE) {
            playerChunks.push(data.players.slice(i, i + BATCH_SIZE));
        }

        console.log(`Caching ${data.players.length} players in ${playerChunks.length} batches of up to ${BATCH_SIZE} each`);

        // Process each chunk in a separate batch
        for (let chunkIndex = 0; chunkIndex < playerChunks.length; chunkIndex++) {
            const chunk = playerChunks[chunkIndex];
            const batch = db.batch();

            console.log(`Processing batch ${chunkIndex + 1}/${playerChunks.length} with ${chunk.length} players`);

            // Add players to batch
            chunk.forEach((player, playerIndex) => {
                try {
                    const docRef = db.collection(CACHE_COLLECTION).doc(`player_${player.id}`);

                    console.log(`${playerIndex + 1}/${chunk.length}: Processing player ${player.web_name} (${player.id})`);

                    // Convert gameweek_data array to gameweeks object
                    const gameweeks: PlayerGameweekCache = {};
                    if (player.gameweek_data) {
                        player.gameweek_data.forEach((gw, index) => {
                            const gameweekNumber = (index + 1).toString();
                            gameweeks[gameweekNumber] = {
                                data: gw,
                                pointsBreakdown: {}, // Will be populated during refresh
                                isFinal: index < currentGameweek - 1, // Previous gameweeks are final
                                lastUpdated: timestamp
                            };
                        });
                    }

                    const cachedPlayer: CachedPlayerData = {
                        ...player,
                        cached_at: timestamp,
                        cache_version: CACHE_VERSION,
                        gameweeks
                    };

                    // Remove gameweek_data from the cached version (it's now in gameweeks)
                    delete (cachedPlayer as any).gameweek_data;

                    batch.set(docRef, cachedPlayer);
                } catch (error) {
                    console.error(`Error preparing player ${player.web_name} for batch:`, error);
                    throw error;
                }
            });

            // Commit this batch
            try {
                await batch.commit();
                console.log(`✅ Batch ${chunkIndex + 1} committed successfully (${chunk.length} players)`);
            } catch (error) {
                console.error(`❌ Batch ${chunkIndex + 1} failed to commit:`, error);
                throw error;
            }

            // Longer delay between batches
            if (chunkIndex < playerChunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        // Update metadata in a separate transaction
        console.log('Updating cache metadata...');
        const metadataRef = db.collection(CACHE_COLLECTION).doc('_metadata');
        const metadata: CacheMetadata = {
            version: CACHE_VERSION,
            lastUpdated: timestamp,
            currentGameweek,
            totalPlayers: data.players.length,
            lastFullRefresh: timestamp,
            gameweeksProcessed: Array.from({ length: currentGameweek }, (_, i) => i + 1)
        };
        await metadataRef.set(metadata);

        console.log(`🎉 Successfully cached ${data.players.length} players in ${playerChunks.length} batches`);
    } catch (error) {
        console.error('Error caching player stats data:', error);
        throw error;
    }
}

export async function getCachedGameweekData(playerIds: number[], gameweeks: number[]): Promise<Map<string, any>> {
    try {
        const cacheMap = new Map<string, any>();

        // Get player documents that might have cached gameweek data
        const playerDocs = await db.collection(CACHE_COLLECTION)
            .where('cache_version', '==', CACHE_VERSION)
            .get();

        playerDocs.docs.forEach(doc => {
            const data = doc.data() as CachedPlayerData;
            const playerId = data.id;

            if (playerIds.includes(playerId) && data.gameweeks) {
                gameweeks.forEach(gw => {
                    const gameweekStr = gw.toString();
                    if (data.gameweeks[gameweekStr]) {
                        const key = `${playerId}-${gw}`;
                        cacheMap.set(key, data.gameweeks[gameweekStr]);
                    }
                });
            }
        });

        console.log(`Retrieved ${cacheMap.size} cached gameweek records from player documents`);
        return cacheMap;
    } catch (error) {
        console.error('Error getting cached gameweek data:', error);
        return new Map();
    }
}

export async function cacheGameweekData(
    playerId: number,
    gameweek: number,
    data: any,
    pointsBreakdown: any,
    isFinal: boolean = false
): Promise<void> {
    try {
        const docRef = db.collection(CACHE_COLLECTION).doc(`player_${playerId}`);
        const gameweekStr = gameweek.toString();

        const gameweekData = {
            data,
            pointsBreakdown,
            isFinal,
            lastUpdated: new Date()
        };

        // Try to update first (most common case)
        try {
            await docRef.update({
                [`gameweeks.${gameweekStr}`]: gameweekData
            });
        } catch (error: any) {
            // If document doesn't exist (NOT_FOUND), create it
            if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
                console.log(`Creating new player document for player ${playerId}`);

                // Create new document with basic structure
                await docRef.set({
                    id: playerId,
                    cache_version: CACHE_VERSION,
                    cached_at: new Date(),
                    gameweeks: {
                        [gameweekStr]: gameweekData
                    }
                });
            } else {
                // Re-throw other errors
                throw error;
            }
        }
    } catch (error) {
        console.error(`Error caching gameweek data for player ${playerId}, GW ${gameweek}:`, error);
    }
}

export async function clearAllCache(): Promise<void> {
    console.log('Clearing all cache data...');

    try {
        // Helper function to delete documents in batches
        const deleteInBatches = async (collectionName: string) => {
            const BATCH_SIZE = 50; // Much smaller batch size for deletions
            let deletedCount = 0;

            while (true) {
                const snapshot = await db.collection(collectionName).limit(BATCH_SIZE).get();

                if (snapshot.empty) {
                    break;
                }

                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                await batch.commit();
                deletedCount += snapshot.docs.length;
                console.log(`Deleted ${snapshot.docs.length} documents from ${collectionName} (total: ${deletedCount})`);

                // Longer delay to avoid rate limiting with more batches
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            return deletedCount;
        };

        // Clear player cache (this now includes all gameweek data)
        console.log('Clearing player cache...');
        const playerCacheCount = await deleteInBatches(CACHE_COLLECTION);

        console.log(`Cache clearing completed: ${playerCacheCount} player records`);
    } catch (error) {
        console.error('Error clearing cache:', error);
        throw error;
    }
}
