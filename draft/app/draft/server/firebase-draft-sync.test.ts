/* Location: app/draft/server/firebase-draft-sync.test.ts */

/**
 * Lives here, not next to the driver in `_shared`, because `_shared` may not import a
 * domain (architecture.test.ts, Rule 1) and `FirebaseDraftSync` is draft's. The Firestore
 * driver's test says the same about the division-teams service.
 *
 * Exercised through `FirebaseDraftSync`, the app's own caller, for the same reason
 * `firestore-memory.test.ts` goes through `FirestoreClient`: what matters is not that a
 * nested object stores things, but that the real caller behaves the same against this
 * driver as it does against the Realtime Database. A driver that passes its own unit tests
 * while breaking its caller would be worse than nothing.
 *
 * The flag is read lazily inside `getRealtimeAdminDbInstance()`, so setting it here — before
 * any test runs, after the imports — is what selects the in-memory driver.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { resetInMemoryRealtimeDb } from '../../_shared/lib/firestore-cache/realtime-memory';

process.env.KAMMY_FIXTURE_FIRESTORE = '1';

const DIVISION = 'premierLeague';

// Imported after the flag is set, though the getter reads it lazily either way.
let FirebaseDraftSync: typeof import('./firebase-draft-sync').FirebaseDraftSync;

beforeAll(async () => {
    ({ FirebaseDraftSync } = await import('./firebase-draft-sync'));
});

afterEach(() => {
    resetInMemoryRealtimeDb();
    FirebaseDraftSync.clearCache();
});

describe('the fixture Realtime Database, through FirebaseDraftSync', () => {
    it('returns null for a draft state that was never written', async () => {
        expect(await FirebaseDraftSync.getDraftState(DIVISION)).toBeNull();
    });

    it('reads back a draft state that was written', async () => {
        await FirebaseDraftSync.updateDraftState(DIVISION, { isActive: true, currentPick: 4 });

        const state = await FirebaseDraftSync.getDraftState(DIVISION);

        expect(state).toMatchObject({ isActive: true, currentPick: 4 });
    });

    it('merges on update, leaving untouched fields alone', async () => {
        await FirebaseDraftSync.updateDraftState(DIVISION, { isActive: true, currentPick: 4 });
        FirebaseDraftSync.clearCache(); // the caller dedupes identical writes

        await FirebaseDraftSync.updateDraftState(DIVISION, { currentPick: 5 });

        const state = await FirebaseDraftSync.getDraftState(DIVISION);
        expect(state).toMatchObject({ isActive: true, currentPick: 5 });
    });

    it('keeps divisions apart', async () => {
        await FirebaseDraftSync.updateDraftState(DIVISION, { isActive: true });

        expect(await FirebaseDraftSync.getDraftState('championship')).toBeNull();
    });

    it('does not hand out a live reference into the store', async () => {
        await FirebaseDraftSync.updateDraftState(DIVISION, { isActive: true, currentPick: 1 });

        const first = (await FirebaseDraftSync.getDraftState(DIVISION)) as { currentPick: number };
        first.currentPick = 999;

        expect(await FirebaseDraftSync.getDraftState(DIVISION)).toMatchObject({ currentPick: 1 });
    });

    it('removes the picks that are no longer valid, and keeps the ones that are', async () => {
        await FirebaseDraftSync.updateDraftPick(DIVISION, 1, { playerCode: 111 });
        await FirebaseDraftSync.updateDraftPick(DIVISION, 2, { playerCode: 222 });

        await FirebaseDraftSync.removeOrphanedPicks(DIVISION, [1]);

        // Read through the same seam the app uses rather than reaching into the driver.
        const { getRealtimeAdminDbInstance } = await import(
            '../../_shared/lib/firestore-cache/firebase.realtime-admin'
        );
        const snapshot = await getRealtimeAdminDbInstance().ref(`drafts/${DIVISION}/picks`).once('value');

        expect(Object.keys(snapshot.val() ?? {})).toEqual(['1']);
    });

    it('appends events under generated keys and clears them again', async () => {
        await FirebaseDraftSync.addDraftEvent(DIVISION, { type: 'pick-made', data: { pickNumber: 1 } } as never);
        await FirebaseDraftSync.addDraftEvent(DIVISION, { type: 'turn-change', data: {} } as never);

        const { getRealtimeAdminDbInstance } = await import(
            '../../_shared/lib/firestore-cache/firebase.realtime-admin'
        );
        const eventsRef = getRealtimeAdminDbInstance().ref(`drafts/${DIVISION}/events`);

        const before = await eventsRef.once('value');
        expect(Object.keys(before.val() ?? {})).toHaveLength(2);

        await FirebaseDraftSync.clearAllEvents(DIVISION);

        expect((await eventsRef.once('value')).exists()).toBe(false);
    });

    it('orders keys so a read is reproducible', async () => {
        // `cleanupOldEvents` reads with orderByKey().limitToFirst(), which is only meaningful
        // if generated keys sort in insertion order.
        for (let i = 0; i < 5; i++) {
            await FirebaseDraftSync.addDraftEvent(DIVISION, { type: 'pick-made', data: { i } } as never);
        }

        const { getRealtimeAdminDbInstance } = await import(
            '../../_shared/lib/firestore-cache/firebase.realtime-admin'
        );
        const snapshot = await getRealtimeAdminDbInstance()
            .ref(`drafts/${DIVISION}/events`)
            .orderByKey()
            .limitToFirst(3)
            .once('value');

        const events = Object.values(snapshot.val() as Record<string, { data: { i: number } }>);
        expect(events.map((event) => event.data.i)).toEqual([0, 1, 2]);
    });

    it('throws on an event type it does not implement, rather than reading nothing', async () => {
        const { getRealtimeAdminDbInstance } = await import(
            '../../_shared/lib/firestore-cache/firebase.realtime-admin'
        );

        await expect(
            getRealtimeAdminDbInstance()
                .ref('drafts')
                .once('child_added' as never),
        ).rejects.toThrow(/unsupported event type/);
    });
});
