/* Location: app/_shared/lib/firestore-cache/firestore-memory.test.ts */

import { afterEach, describe, expect, it } from 'vitest';
import { FirestoreClearService } from './clear-service';
import { getFirestoreInstance } from './firebase.admin';
import { FirestoreClient } from './firestore-client';
import { resetInMemoryFirestore } from './firestore-memory';

/**
 * The driver is exercised through the app's own Firestore callers rather than directly,
 * because what matters is not that a Map stores things -- it is that `FirestoreClient`
 * and `FirestoreClearService` behave the same against it as they do against Firestore.
 * A driver that passes its own unit tests while breaking the real callers would be worse
 * than nothing, since the whole harness sits on top of it.
 *
 * The division-teams service is the other caller that matters, and its test lives in
 * `scoring/` -- _shared may not import a domain (architecture.test.ts, Rule 1).
 *
 * The flag is read lazily inside `getFirestoreInstance()`, so setting it after the
 * imports is fine: nothing calls the getter at module scope.
 */
process.env.KAMMY_FIXTURE_FIRESTORE = '1';

const CACHE_STATE = 'cache-state';

const client = new FirestoreClient();

const cacheDoc = (data: unknown) => ({ data, source: 'fpl' as const, lastUpdated: '' });

afterEach(() => {
    resetInMemoryFirestore();
});

describe('the fixture Firestore, through FirestoreClient', () => {
    it('reads back a document that was written', async () => {
        await client.setDocument(CACHE_STATE, 'events', cacheDoc([{ id: 21, name: 'Gameweek 21' }]));

        const doc = await client.getDocument<Array<{ id: number }>>(CACHE_STATE, 'events');

        expect(doc?.data).toEqual([{ id: 21, name: 'Gameweek 21' }]);
        expect(doc?.id).toBe('events');
        expect(doc?.source).toBe('fpl');
    });

    it('stamps lastUpdated on write, so a stale-cache check has something to read', async () => {
        await client.setDocument(CACHE_STATE, 'events', cacheDoc([]));

        const doc = await client.getDocument(CACHE_STATE, 'events');

        expect(Number.isNaN(Date.parse(doc?.lastUpdated ?? ''))).toBe(false);
    });

    it('returns null for a document that was never written', async () => {
        expect(await client.getDocument(CACHE_STATE, 'nothing-here')).toBeNull();
        expect(await client.documentExists(CACHE_STATE, 'nothing-here')).toBe(false);
    });

    it('reports a written document as existing', async () => {
        await client.setDocument(CACHE_STATE, 'teams', cacheDoc([]));

        expect(await client.documentExists(CACHE_STATE, 'teams')).toBe(true);
    });

    it('merges on update, leaving untouched fields alone', async () => {
        await client.setDocument(CACHE_STATE, 'events', cacheDoc(['before']));

        await client.updateDocument(CACHE_STATE, 'events', { data: ['after'] });
        const doc = await client.getDocument(CACHE_STATE, 'events');

        expect(doc?.data).toEqual(['after']);
        expect(doc?.source).toBe('fpl'); // not part of the update, so it must survive it
    });

    it('rejects an update to a document that does not exist, as Firestore does', async () => {
        await expect(client.updateDocument(CACHE_STATE, 'never-created', { data: [] })).rejects.toThrow(
            /does not exist/,
        );
    });

    it('does not hand out a live reference to the stored document', async () => {
        await client.setDocument(CACHE_STATE, 'events', cacheDoc([{ id: 21 }]));

        const first = await client.getDocument<Array<{ id: number }>>(CACHE_STATE, 'events');
        (first?.data as Array<{ id: number }>)[0].id = 999;
        const second = await client.getDocument<Array<{ id: number }>>(CACHE_STATE, 'events');

        expect(second?.data).toEqual([{ id: 21 }]);
    });

    it('batch-reads in the order asked, with null for the ids that are missing', async () => {
        await client.setDocument(CACHE_STATE, 'a', cacheDoc('A'));
        await client.setDocument(CACHE_STATE, 'c', cacheDoc('C'));

        const docs = await client.batchGetDocuments<string>(CACHE_STATE, ['a', 'b', 'c']);

        expect(docs.map((doc) => doc?.data ?? null)).toEqual(['A', null, 'C']);
    });

    it('applies every operation in a batch write', async () => {
        await client.batchWrite([
            { collection: CACHE_STATE, docId: 'a', data: cacheDoc('A'), operation: 'set' },
            { collection: CACHE_STATE, docId: 'b', data: cacheDoc('B'), operation: 'set' },
        ]);

        expect((await client.getDocument(CACHE_STATE, 'a'))?.data).toBe('A');
        expect((await client.getDocument(CACHE_STATE, 'b'))?.data).toBe('B');
    });

    it('filters a query by a where condition', async () => {
        await client.setDocument(CACHE_STATE, 'a', { data: 'A', source: 'fpl', lastUpdated: '' });
        await client.setDocument(CACHE_STATE, 'b', { data: 'B', source: 'sheets', lastUpdated: '' });

        const rows = await client.queryDocuments(CACHE_STATE, [{ field: 'source', operator: '==', value: 'sheets' }]);

        expect(rows.map((row) => row.id)).toEqual(['b']);
    });
});

describe('the fixture Firestore, directly', () => {
    it('counts the documents in a collection', async () => {
        await client.setDocument(CACHE_STATE, 'a', cacheDoc('A'));
        await client.setDocument(CACHE_STATE, 'b', cacheDoc('B'));

        const snapshot = await getFirestoreInstance().collection(CACHE_STATE).count().get();

        expect(snapshot.data().count).toBe(2);
    });

    it('answers the connectivity probe with an empty result rather than throwing', async () => {
        // system-status.service.ts uses exactly this call to decide Firebase is healthy
        const snapshot = await getFirestoreInstance().collection('test').limit(1).get();

        expect(snapshot.empty).toBe(true);
    });

    it('orders documents by id, so a harness run is reproducible', async () => {
        for (const id of ['c', 'a', 'b']) {
            await client.setDocument(CACHE_STATE, id, cacheDoc(id));
        }

        const snapshot = await getFirestoreInstance().collection(CACHE_STATE).get();

        expect(snapshot.docs.map((doc) => doc.id)).toEqual(['a', 'b', 'c']);
    });

    it('writes a Date as an ISO string, which is the documented gap versus a real Timestamp', async () => {
        // fpl-firestore.ts:62-72 accepts either, which is why gameweek events survive this.
        // A new caller reaching for .toDate() would pass here and fail in production.
        await client.setDocument(CACHE_STATE, 'events', cacheDoc({ start: new Date('2025-01-20T00:00:00.000Z') }));

        const doc = await client.getDocument<{ start: unknown }>(CACHE_STATE, 'events');

        expect(doc?.data.start).toBe('2025-01-20T00:00:00.000Z');
    });
});

describe('the fixture Firestore, through FirestoreClearService', () => {
    it('empties a collection using the ids-only read and a batched delete', async () => {
        for (const id of ['a', 'b', 'c']) {
            await client.setDocument(CACHE_STATE, id, cacheDoc(id));
        }

        await new FirestoreClearService().clearCollection(CACHE_STATE);

        const snapshot = await getFirestoreInstance().collection(CACHE_STATE).count().get();
        expect(snapshot.data().count).toBe(0);
    });
});
