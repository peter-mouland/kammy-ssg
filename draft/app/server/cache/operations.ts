import { getFirestoreInstance } from '../../lib/firebase.admin';
import type { CacheOperationStatus } from './types';
import { CACHE_STATUS_COLLECTION, timestampToDate } from './utils';

const db = getFirestoreInstance();

export async function getCacheOperationStatus(): Promise<CacheOperationStatus | null> {
    try {
        const statusDoc = await db.collection(CACHE_STATUS_COLLECTION).doc('current_operation').get();

        if (!statusDoc.exists) {
            return null;
        }

        const data = statusDoc.data() as any;

        // Convert timestamps
        return {
            ...data,
            startedAt: timestampToDate(data.startedAt),
            completedAt: data.completedAt ? timestampToDate(data.completedAt) : undefined
        } as CacheOperationStatus;
    } catch (error) {
        console.error('Error getting cache operation status:', error);
        return null;
    }
}

export async function setCacheOperationStatus(status: CacheOperationStatus): Promise<void> {
    try {
        await db.collection(CACHE_STATUS_COLLECTION).doc('current_operation').set(status);
    } catch (error) {
        console.error('Error setting cache operation status:', error);
    }
}

export async function clearCacheOperationStatus(): Promise<void> {
    try {
        await db.collection(CACHE_STATUS_COLLECTION).doc('current_operation').delete();
    } catch (error) {
        console.error('Error clearing cache operation status:', error);
    }
}

export async function isCacheOperationRunning(): Promise<boolean> {
    const status = await getCacheOperationStatus();
    return status?.status === 'running';
}
