// src/lib/firestore-cache/firestore-client.ts
import { getFirestoreInstance } from './firebase.admin'; // Your firebase config
import type { CacheDocument } from './types';

export class FirestoreClient {
    private readonly COLLECTIONS = {
        FPL_ENDPOINTS: 'fpl-endpoints',
        FPL_BOOTSTRAP: 'fpl-bootstrap',
        FPL_ELEMENTS: 'fpl-elements',
        CACHE_STATE: 'cache-state'
    } as const;

    private get db() {
        return getFirestoreInstance();
    }

    async documentExists(collectionName: string, docId: string): Promise<boolean> {
        const docRef = this.db.collection(collectionName).doc(docId);
        const docSnap = await docRef.get();
        return docSnap.exists;
    }

    async getDocument<TData = unknown>(
        collectionName: string,
        docId: string
    ): Promise<CacheDocument & { data: TData } | null> {
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
        data: Omit<CacheDocument, 'id' | 'lastUpdated'> & { data: unknown }
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
        data: Partial<Pick<CacheDocument, 'data'>>
    ): Promise<void> {
        const docRef = this.db.collection(collectionName).doc(docId);
        await docRef.update({
            ...data,
            lastUpdated: new Date().toISOString(),
        });
    }

    async batchGetDocuments<TData = unknown>(
        collectionName: string,
        docIds: string[]
    ): Promise<Array<CacheDocument & { data: TData } | null>> {
        if (docIds.length === 0) return [];

        // Admin SDK doesn't have the same batch read limitations as client SDK
        // But we'll still chunk for performance
        const chunks = this.chunkArray(docIds, 10);
        const results: Array<CacheDocument & { data: TData } | null> = [];

        for (const chunk of chunks) {
            const promises = chunk.map(id => this.getDocument<TData>(collectionName, id));
            const chunkResults = await Promise.all(promises);
            results.push(...chunkResults);
        }

        return results;
    }

    async batchWrite(operations: Array<{
        collection: string;
        docId: string;
        data: Omit<CacheDocument, 'id' | 'lastUpdated'> & { data: unknown };
        operation: 'set' | 'update';
    }>): Promise<void> {
        const batch = this.db.batch();
        const timestamp = new Date().toISOString();

        operations.forEach(({ collection: collectionName, docId, data, operation }) => {
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
    }

    async queryDocuments<TData = unknown>(
        collectionName: string,
        conditions: Array<{ field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }>
    ): Promise<Array<CacheDocument & { data: TData }>> {
        let query = this.db.collection(collectionName) as FirebaseFirestore.Query;

        conditions.forEach(({ field, operator, value }) => {
            query = query.where(field, operator, value);
        });

        const querySnapshot = await query.get();
        return querySnapshot.docs.map(doc => doc.data() as CacheDocument & { data: TData });
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    // Collection getters for type safety
    get collections() {
        return this.COLLECTIONS;
    }
}
