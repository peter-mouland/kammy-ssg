/* Location: app/_shared/lib/firestore-cache/firestore-client.ts */
/** biome-ignore-all lint/style/useNamingConvention: <i likey> */

import { processBatchedReads } from '../batch-processor';
import { getFirestoreInstance } from './firebase.admin';
import type { CacheDocument } from './types';

export class FirestoreClient {
    private readonly COLLECTIONS = {
        FPL_BOOTSTRAP: 'fpl-bootstrap',
        FPL_ELEMENTS: 'fpl-elements',
        DIVISION_TEAMS: 'division-teams',
        CACHE_STATE: 'cache-state',
    } as const;

    get db() {
        return getFirestoreInstance();
    }

    async documentExists(collectionName: string, docId: string): Promise<boolean> {
        const docRef = this.db.collection(collectionName).doc(docId);
        const docSnap = await docRef.get();
        return docSnap.exists;
    }

    async getDocument<TData = unknown>(
        collectionName: string,
        docId: string,
    ): Promise<(CacheDocument & { data: TData }) | null> {
        const docRef = this.db.collection(collectionName).doc(docId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }

        return docSnap.data() as CacheDocument & { data: TData };
    }

    async setDocument(
        collectionName: string,
        docId: string,
        data: Omit<CacheDocument, 'id'> & { data: unknown },
    ): Promise<void> {
        const docRef = this.db.collection(collectionName).doc(docId);
        const documentData: CacheDocument = {
            ...data,
            id: docId,
            lastUpdated: new Date().toISOString(),
        };

        await docRef.set(documentData);
    }

    async updateDocument(
        collectionName: string,
        docId: string,
        data: Partial<Pick<CacheDocument, 'data'>>,
    ): Promise<void> {
        const docRef = this.db.collection(collectionName).doc(docId);
        await docRef.update({
            ...data,
            lastUpdated: new Date().toISOString(),
        });
    }

    async batchGetDocuments<TData = unknown>(
        collectionName: string,
        docIds: string[],
    ): Promise<Array<(CacheDocument & { data: TData }) | null>> {
        if (docIds.length === 0) return [];

        return await processBatchedReads(
            docIds,
            async (batch: string[]) => {
                const docRefs = batch.map((id) => this.db.collection(collectionName).doc(id));
                const snapshots = await this.db.getAll(...docRefs);

                return snapshots.map((snapshot) =>
                    snapshot.exists ? (snapshot.data() as CacheDocument & { data: TData }) : null,
                );
            },
            {
                batchSize: 100, // Matches Firestore's getAll() limit
                logProgress: false, // Keep it quiet for internal operations
            },
        );
    }

    async batchWrite(
        operations: Array<{
            collection: string;
            docId: string;
            data: Omit<CacheDocument, 'id' | 'lastUpdated'> & { data: unknown };
            operation: 'set' | 'update';
        }>,
    ): Promise<void> {
        if (operations.length === 0) return;

        await processBatchedReads(
            operations,
            async (operationBatch) => {
                const batch = this.db.batch();
                const timestamp = new Date().toISOString();

                operationBatch.forEach(({ collection: collectionName, docId, data, operation }) => {
                    const docRef = this.db.collection(collectionName).doc(docId);
                    const documentData: CacheDocument = {
                        ...data,
                        id: docId,
                        lastUpdated: timestamp,
                    };

                    if (operation === 'set') {
                        batch.set(docRef, documentData);
                    } else {
                        batch.update(docRef, documentData);
                    }
                });

                await batch.commit();
                return []; // processBatchedReads expects a return value
            },
            {
                batchSize: 500, // Firestore's batch write limit
                logProgress: operations.length > 500, // Only log for large operations
            },
        );
    }

    async queryDocuments<TData = unknown>(
        collectionName: string,
        conditions: Array<{ field: string; operator: FirebaseFirestore.WhereFilterOp; value: unknown }>,
    ): Promise<Array<CacheDocument & { data: TData }>> {
        let query = this.db.collection(collectionName) as FirebaseFirestore.Query;

        conditions.forEach(({ field, operator, value }) => {
            query = query.where(field, operator, value);
        });

        const querySnapshot = await query.get();
        return querySnapshot.docs.map((doc) => doc.data() as CacheDocument & { data: TData });
    }

    // Collection getters for type safety
    get collections() {
        return this.COLLECTIONS;
    }
}
