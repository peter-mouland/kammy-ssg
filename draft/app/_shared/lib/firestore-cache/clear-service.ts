/* Location: app/_shared/lib/firestore-cache/clear-service.ts */
// biome-ignore-all lint/style/useNamingConvention: external API shape uses snake_case

// lib/firestore-cache/clear-service.ts
import { FirestoreClient } from './firestore-client';

interface ClearProgress {
    stage: string;
    progress: number;
    total: number;
    completed: boolean;
    error?: string;
}

/** What one bounded pass of `clearEverything` managed to do. */
export interface ClearPass {
    /** Documents deleted in this pass. */
    deleted: number;
    /** Per collection, what this pass removed and whether anything is left. */
    collections: Array<{ name: string; deleted: number; emptied: boolean }>;
    /** False when the budget ran out with documents still to delete — call again. */
    done: boolean;
}

export class FirestoreClearService {
    private client: FirestoreClient;
    /**
     * Firestore's hard limit is 500 writes per batch. This was 10, with a 100ms sleep
     * between batches, which made clearing a few thousand documents take minutes — long
     * enough that the ssr function's 60s timeout killed "Reset Database" every time and
     * returned a generic error with nothing in it.
     */
    private readonly BATCH_SIZE = 400;
    private readonly DELAY_BETWEEN_BATCHES = 0; // ms; batches of 400 are their own rate limit

    /**
     * How long one `clearEverything` pass may run for.
     *
     * The ssr function's timeout is 60s, so a pass stops well inside it and reports what is
     * left. The caller repeats until `done`, which is what makes a collection of any size
     * clearable through a request that cannot itself run for long.
     */
    private readonly PASS_BUDGET_MS = 25_000;

    constructor() {
        this.client = new FirestoreClient();
    }

    /**
     * Delete everything, a bounded pass at a time.
     *
     * Two things were wrong with clearing a fixed list of collections in one request:
     * `player-gameweeks` and `player_stats_cache` are left over from an earlier version of
     * the app and appear nowhere in the code, so no hard-coded list mentioned them and every
     * "reset the entire database" left them untouched; and a collection large enough to
     * outlast the function timeout could never be cleared at all.
     *
     * So the collections are discovered from Firestore rather than listed here, and a pass
     * stops when its time budget runs out and says whether to call it again.
     */
    async clearEverything(budgetMs: number = this.PASS_BUDGET_MS): Promise<ClearPass> {
        const startedAt = Date.now();
        const names = await this.listCollectionNames();
        const collections: ClearPass['collections'] = [];
        let deleted = 0;
        let done = true;

        for (const name of names) {
            const remainingBudget = budgetMs - (Date.now() - startedAt);
            if (remainingBudget <= 0) {
                // Untouched this pass. Not emptied, so the caller comes back.
                done = false;
                break;
            }

            const pass = await this.clearCollectionWithin(name, remainingBudget);
            deleted += pass.deleted;
            collections.push({ name, deleted: pass.deleted, emptied: pass.emptied });
            if (!pass.emptied) done = false;
        }

        console.log(`🗑️ Clear pass: ${deleted} documents in ${Date.now() - startedAt}ms, done=${done}`);

        return { deleted, collections, done };
    }

    /**
     * Delete from one collection until it is empty or the budget runs out.
     *
     * Reads a bounded page rather than every id up front: `getAllDocumentIds` pulls the whole
     * collection into memory, which is its own failure mode on a large one.
     */
    private async clearCollectionWithin(
        collectionName: string,
        budgetMs: number,
    ): Promise<{ deleted: number; emptied: boolean }> {
        const startedAt = Date.now();
        const db = this.client.db;
        let deleted = 0;

        while (Date.now() - startedAt < budgetMs) {
            const snapshot = await db.collection(collectionName).select().limit(this.BATCH_SIZE).get();
            if (snapshot.docs.length === 0) {
                return { deleted, emptied: true };
            }

            const batch = db.batch();
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();

            deleted += snapshot.docs.length;
            if (this.DELAY_BETWEEN_BATCHES > 0) await this.delay(this.DELAY_BETWEEN_BATCHES);
        }

        // Budget spent. A shorter page than a full batch means it was the last one anyway.
        return { deleted, emptied: false };
    }

    /**
     * Every collection in the database, falling back to the ones the app knows about.
     *
     * `listCollections()` needs `datastore.entities.list`, which a restricted service account
     * may not have. Falling back keeps reset working at the level it worked at before rather
     * than failing outright — but it will then miss orphaned collections, so it says so.
     */
    private async listCollectionNames(): Promise<string[]> {
        try {
            const collections = await this.client.db.listCollections();
            return collections.map((collection) => collection.id).sort();
        } catch (error) {
            console.warn(
                '⚠️ Could not list collections; falling back to the known list. Collections this build ' +
                    'does not name will not be cleared.',
                error,
            );
            return Object.values(this.client.collections);
        }
    }

    /**
     * Clear all Firestore data with progress tracking
     */
    async clearAllData(progressCallback?: (progress: ClearProgress) => void): Promise<void> {
        const collections = [
            { name: this.client.collections.DIVISION_TEAMS, description: 'Team GW Data' },
            { name: this.client.collections.FPL_BOOTSTRAP, description: 'FPL Bootstrap Data' },
            { name: this.client.collections.FPL_ELEMENTS, description: 'FPL Element Summaries' },
            { name: this.client.collections.CACHE_STATE, description: 'Cache State' },
        ];

        const totalStages = collections.length;
        let currentStage = 0;

        try {
            for (const collection of collections) {
                currentStage++;

                progressCallback?.({
                    stage: `Clearing ${collection.description}`,
                    progress: currentStage - 1,
                    total: totalStages,
                    completed: false,
                });

                await this.clearCollection(collection.name, (batchProgress) => {
                    progressCallback?.({
                        stage: `Clearing ${collection.description} (${batchProgress.completed}/${batchProgress.total})`,
                        progress: currentStage - 1,
                        total: totalStages,
                        completed: false,
                    });
                });

                // Small delay between collections
                await this.delay(200);
            }

            progressCallback?.({
                stage: 'Clear completed successfully',
                progress: totalStages,
                total: totalStages,
                completed: true,
            });
        } catch (error) {
            progressCallback?.({
                stage: 'Clear failed',
                progress: currentStage,
                total: totalStages,
                completed: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Clear a specific collection with batching
     */
    async clearCollection(
        collectionName: string,
        progressCallback?: (progress: { completed: number; total: number }) => void,
    ): Promise<void> {
        console.log(`🗑️ Starting to clear collection: ${collectionName}`);

        try {
            // Get all document IDs first (more efficient than getting full documents)
            const documentIds = await this.getAllDocumentIds(collectionName);

            if (documentIds.length === 0) {
                console.log(`✅ Collection ${collectionName} is already empty`);
                progressCallback?.({ completed: 0, total: 0 });
                return;
            }

            console.log(`📊 Found ${documentIds.length} documents to delete`);

            // Process in batches
            const batches = this.chunkArray(documentIds, this.BATCH_SIZE);
            let completed = 0;

            console.log(`🗑️ Deleting ${batches.length} batches of ${this.BATCH_SIZE} documents`);
            for (const batch of batches) {
                await this.deleteBatch(collectionName, batch);
                completed += batch.length;

                progressCallback?.({
                    completed,
                    total: documentIds.length,
                });

                // Delay between batches to avoid rate limiting
                if (completed < documentIds.length) {
                    await this.delay(this.DELAY_BETWEEN_BATCHES);
                }
            }

            console.log(`✅ Successfully cleared ${documentIds.length} documents from ${collectionName}`);
        } catch (error) {
            console.error(`❌ Failed to clear collection ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Get all document IDs in a collection (lightweight operation)
     */
    private async getAllDocumentIds(collectionName: string): Promise<string[]> {
        try {
            const db = this.client.db; // Access private db property
            const snapshot = await db.collection(collectionName).select().get();

            return snapshot.docs.map((doc) => doc.id);
        } catch (error) {
            console.error(`Failed to get document IDs for ${collectionName}:`, error);
            return [];
        }
    }

    /**
     * Delete a batch of documents
     */
    private async deleteBatch(collectionName: string, documentIds: string[]): Promise<void> {
        const db = this.client.db; // Access private db property
        const batch = db.batch();

        documentIds.forEach((docId) => {
            const docRef = db.collection(collectionName).doc(docId);
            batch.delete(docRef);
        });

        await batch.commit();
        console.log(`🗑️ Deleted batch of ${documentIds.length} documents from ${collectionName}`);
    }

    /**
     * Clear specific collections (selective clearing)
     */
    async clearSpecificCollections(
        collections: string[],
        progressCallback?: (progress: ClearProgress) => void,
    ): Promise<void> {
        let currentStage = 0;
        const totalStages = collections.length;

        try {
            for (const collectionName of collections) {
                currentStage++;

                progressCallback?.({
                    stage: `Clearing ${collectionName}`,
                    progress: currentStage - 1,
                    total: totalStages,
                    completed: false,
                });

                await this.clearCollection(collectionName, (batchProgress) => {
                    progressCallback?.({
                        stage: `Clearing ${collectionName} (${batchProgress.completed}/${batchProgress.total})`,
                        progress: currentStage - 1,
                        total: totalStages,
                        completed: false,
                    });
                });

                await this.delay(200);
            }

            progressCallback?.({
                stage: 'Selective clear completed',
                progress: totalStages,
                total: totalStages,
                completed: true,
            });
        } catch (error) {
            progressCallback?.({
                stage: 'Selective clear failed',
                progress: currentStage,
                total: totalStages,
                completed: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Get collection statistics (for UI display)
     */
    async getCollectionStats(): Promise<Record<string, number>> {
        const stats: Record<string, number> = {};

        const collections = [
            this.client.collections.FPL_BOOTSTRAP,
            this.client.collections.FPL_ELEMENTS,
            this.client.collections.CACHE_STATE,
        ];

        await Promise.all(
            collections.map(async (collectionName) => {
                try {
                    const documentIds = await this.getAllDocumentIds(collectionName);
                    stats[collectionName] = documentIds.length;
                } catch (error) {
                    console.error(`Failed to get stats for ${collectionName}:`, error);
                    stats[collectionName] = 0;
                }
            }),
        );

        return stats;
    }

    /**
     * Clear only FPL cached data (keep other data intact)
     */
    async clearFplFirestoreOnly(progressCallback?: (progress: ClearProgress) => void): Promise<void> {
        const fplCollections = [this.client.collections.FPL_BOOTSTRAP, this.client.collections.FPL_ELEMENTS];

        await this.clearSpecificCollections(fplCollections, progressCallback);
    }

    /**
     * Clear only element summaries (large collection)
     */
    async clearElementDetailedStatsOnly(progressCallback?: (progress: ClearProgress) => void): Promise<void> {
        await this.clearSpecificCollections([this.client.collections.FPL_ELEMENTS], progressCallback);
    }

    /**
     * Utility methods
     */
    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Estimate clear time based on document count
     */
    async estimateClearTime(): Promise<{
        totalDocuments: number;
        estimatedTimeSeconds: number;
        estimatedBatches: number;
    }> {
        const stats = await this.getCollectionStats();
        const totalDocuments = Object.values(stats).reduce((sum, count) => sum + count, 0);
        const estimatedBatches = Math.ceil(totalDocuments / this.BATCH_SIZE);

        // Rough estimate: 1 second per batch + delays
        const estimatedTimeSeconds = estimatedBatches * 1.2; // Include delays and overhead

        return {
            totalDocuments,
            estimatedTimeSeconds,
            estimatedBatches,
        };
    }
}
