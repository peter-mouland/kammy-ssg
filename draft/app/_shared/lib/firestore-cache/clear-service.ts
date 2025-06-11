// lib/firestore-cache/clear-service.ts
import { FirestoreClient } from './firestore-client';

interface ClearProgress {
    stage: string;
    progress: number;
    total: number;
    completed: boolean;
    error?: string;
}

export class FirestoreClearService {
    private client: FirestoreClient;
    private readonly BATCH_SIZE = 50; // Documents per batch
    private readonly DELAY_BETWEEN_BATCHES = 100; // ms

    constructor() {
        this.client = new FirestoreClient();
    }

    /**
     * Clear all Firestore data with progress tracking
     */
    async clearAllData(
        progressCallback?: (progress: ClearProgress) => void
    ): Promise<void> {
        const collections = [
            { name: this.client.collections.FPL_BOOTSTRAP, description: 'FPL Bootstrap Data' },
            { name: this.client.collections.FPL_ELEMENTS, description: 'FPL Element Summaries' },
            { name: this.client.collections.CACHE_STATE, description: 'Cache State' }
        ];

        let totalStages = collections.length;
        let currentStage = 0;

        try {
            for (const collection of collections) {
                currentStage++;

                progressCallback?.({
                    stage: `Clearing ${collection.description}`,
                    progress: currentStage - 1,
                    total: totalStages,
                    completed: false
                });

                await this.clearCollection(collection.name, (batchProgress) => {
                    progressCallback?.({
                        stage: `Clearing ${collection.description} (${batchProgress.completed}/${batchProgress.total})`,
                        progress: currentStage - 1,
                        total: totalStages,
                        completed: false
                    });
                });

                // Small delay between collections
                await this.delay(200);
            }

            progressCallback?.({
                stage: 'Clear completed successfully',
                progress: totalStages,
                total: totalStages,
                completed: true
            });

        } catch (error) {
            progressCallback?.({
                stage: 'Clear failed',
                progress: currentStage,
                total: totalStages,
                completed: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Clear a specific collection with batching
     */
    private async clearCollection(
        collectionName: string,
        progressCallback?: (progress: { completed: number; total: number }) => void
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

            for (const batch of batches) {
                await this.deleteBatch(collectionName, batch);
                completed += batch.length;

                progressCallback?.({
                    completed,
                    total: documentIds.length
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
            const db = this.client['db']; // Access private db property
            const snapshot = await db.collection(collectionName).select().get();

            return snapshot.docs.map(doc => doc.id);
        } catch (error) {
            console.error(`Failed to get document IDs for ${collectionName}:`, error);
            return [];
        }
    }

    /**
     * Delete a batch of documents
     */
    private async deleteBatch(collectionName: string, documentIds: string[]): Promise<void> {
        const db = this.client['db']; // Access private db property
        const batch = db.batch();

        documentIds.forEach(docId => {
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
        progressCallback?: (progress: ClearProgress) => void
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
                    completed: false
                });

                await this.clearCollection(collectionName, (batchProgress) => {
                    progressCallback?.({
                        stage: `Clearing ${collectionName} (${batchProgress.completed}/${batchProgress.total})`,
                        progress: currentStage - 1,
                        total: totalStages,
                        completed: false
                    });
                });

                await this.delay(200);
            }

            progressCallback?.({
                stage: 'Selective clear completed',
                progress: totalStages,
                total: totalStages,
                completed: true
            });

        } catch (error) {
            progressCallback?.({
                stage: 'Selective clear failed',
                progress: currentStage,
                total: totalStages,
                completed: false,
                error: error instanceof Error ? error.message : 'Unknown error'
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
            this.client.collections.CACHE_STATE
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
            })
        );

        return stats;
    }

    /**
     * Clear only FPL cached data (keep other data intact)
     */
    async clearFplCacheOnly(
        progressCallback?: (progress: ClearProgress) => void
    ): Promise<void> {
        const fplCollections = [
            this.client.collections.FPL_BOOTSTRAP,
            this.client.collections.FPL_ELEMENTS
        ];

        await this.clearSpecificCollections(fplCollections, progressCallback);
    }

    /**
     * Clear only element summaries (large collection)
     */
    async clearElementSummariesOnly(
        progressCallback?: (progress: ClearProgress) => void
    ): Promise<void> {
        await this.clearSpecificCollections(
            [this.client.collections.FPL_ELEMENTS],
            progressCallback
        );
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
        return new Promise(resolve => setTimeout(resolve, ms));
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
            estimatedBatches
        };
    }
}
