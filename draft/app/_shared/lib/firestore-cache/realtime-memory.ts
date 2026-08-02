/* Location: app/_shared/lib/firestore-cache/realtime-memory.ts */

/**
 * An in-memory Realtime Database, selected the same way the in-memory Firestore is.
 *
 * **It is never active in production.** `getRealtimeAdminDbInstance()` selects it only when
 * `usingFixtureBackends()` is true, exactly as `getFirestoreInstance()` selects
 * `firestore-memory.ts`. Callers get a database and know nothing about which one.
 *
 * This exists so that "we are running on fixtures" is answered in **one place, at the seam**,
 * rather than by conditions spread through the app. The first version of the fixture support
 * put a `process.env.KAMMY_FIXTURE_FIRESTORE` check inside `getAllDraftSyncComparisons()` --
 * a domain service deciding what to do based on test infrastructure, which is the wrong shape
 * and gets copied. With a driver behind the existing seam, the sync comparison just runs: it
 * reads an empty database and reports no differences, which is the truth.
 *
 * Like the Firestore driver, it implements exactly the calls the app makes and throws on
 * anything else, so a new call site is a loud failure rather than a silent empty read:
 *
 *   db.ref(path)                                  -- firebase-draft-sync.ts
 *   ref.set(value) / .update(value) / .remove()
 *   ref.push()                                    -- returns a child ref with a new key
 *   ref.once('value')                             -- resolves to a snapshot
 *   ref.orderByKey().limitToFirst(n).once('value')
 *   snapshot.exists() / .val()
 *
 * Values go through a JSON round-trip on write, so shape drift surfaces as it would over the
 * wire and a read cannot hand out a mutable reference into the store.
 */

type Node = Record<string, unknown>;

const clone = <T>(value: T): T => (value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T));

const segmentsOf = (path: string): string[] => path.split('/').filter(Boolean);

class MemoryRealtimeStore {
    private root: Node = {};

    read(path: string): unknown {
        return segmentsOf(path).reduce<unknown>((node, segment) => {
            if (node === null || typeof node !== 'object') return undefined;
            return (node as Node)[segment];
        }, this.root);
    }

    write(path: string, value: unknown): void {
        const segments = segmentsOf(path);
        if (segments.length === 0) {
            this.root = (clone(value) as Node) ?? {};
            return;
        }

        const last = segments.pop() as string;
        let cursor = this.root;
        for (const segment of segments) {
            const next = cursor[segment];
            cursor[segment] = next && typeof next === 'object' && !Array.isArray(next) ? (next as Node) : {};
            cursor = cursor[segment] as Node;
        }

        if (value === null || value === undefined) {
            delete cursor[last];
            return;
        }
        cursor[last] = clone(value);
    }

    /** `update` merges at the top level of the target, as the real API does. */
    merge(path: string, value: unknown): void {
        const existing = this.read(path);
        if (existing && typeof existing === 'object' && value && typeof value === 'object') {
            this.write(path, { ...(existing as Node), ...(value as Node) });
            return;
        }
        this.write(path, value);
    }

    clear(): void {
        this.root = {};
    }
}

class MemorySnapshot {
    constructor(private readonly value: unknown) {}

    exists(): boolean {
        return this.value !== undefined && this.value !== null;
    }

    val(): unknown {
        return clone(this.value);
    }
}

/** `orderByKey()` and `limitToFirst()` narrow a read; nothing else is supported. */
class MemoryQuery {
    constructor(
        protected readonly store: MemoryRealtimeStore,
        protected readonly path: string,
        private readonly ordered = false,
        private readonly limit: number | null = null,
    ) {}

    orderByKey(): MemoryQuery {
        return new MemoryQuery(this.store, this.path, true, this.limit);
    }

    limitToFirst(count: number): MemoryQuery {
        return new MemoryQuery(this.store, this.path, this.ordered, count);
    }

    async once(eventType: string): Promise<MemorySnapshot> {
        if (eventType !== 'value') {
            throw new Error(`[fixture-realtime] unsupported event type: ${eventType}`);
        }

        const value = this.store.read(this.path);
        if (!this.ordered && this.limit === null) return new MemorySnapshot(value);
        if (!value || typeof value !== 'object') return new MemorySnapshot(value);

        // Real RTDB orders children by key; sorting here is what makes a harness run
        // reproducible, the same reason the Firestore driver orders by document id.
        const entries = Object.entries(value as Node).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
        const limited = this.limit === null ? entries : entries.slice(0, this.limit);
        return new MemorySnapshot(Object.fromEntries(limited));
    }
}

class MemoryReference extends MemoryQuery {
    private static pushCounter = 0;

    async set(value: unknown): Promise<void> {
        this.store.write(this.path, value);
    }

    async update(value: unknown): Promise<void> {
        this.store.merge(this.path, value);
    }

    async remove(): Promise<void> {
        this.store.write(this.path, null);
    }

    /**
     * A child ref under a newly generated key.
     *
     * Real push ids sort chronologically; a zero-padded counter does too, which is all the
     * `orderByKey()` read above depends on.
     */
    push(): MemoryReference {
        MemoryReference.pushCounter += 1;
        const key = `fixture-${String(MemoryReference.pushCounter).padStart(12, '0')}`;
        return new MemoryReference(this.store, `${this.path}/${key}`);
    }
}

class MemoryRealtimeDatabase {
    readonly store = new MemoryRealtimeStore();

    ref(path: string): MemoryReference {
        return new MemoryReference(this.store, path);
    }
}

/**
 * The app types this as `firebase-admin`'s `Database`, and this implements a deliberate
 * subset of it, so the structural types cannot line up. One cast, here.
 */
function asDatabase(instance: MemoryRealtimeDatabase): import('firebase-admin/database').Database {
    return instance as unknown as import('firebase-admin/database').Database;
}

let singleton: MemoryRealtimeDatabase | undefined;

export function getInMemoryRealtimeDb(): import('firebase-admin/database').Database {
    if (!singleton) singleton = new MemoryRealtimeDatabase();
    return asDatabase(singleton);
}

/** Drop everything. Call between scenarios so one does not leak into the next. */
export function resetInMemoryRealtimeDb(): void {
    singleton?.store.clear();
}
