/* Location: app/_shared/lib/firestore-cache/firestore-memory.ts */

/**
 * An in-memory stand-in for Firestore, used by the offline test harness.
 *
 * **It is never active in production.** `getFirestoreInstance()` selects it only when
 * `KAMMY_FIXTURE_FIRESTORE=1`, which nothing but the harness and its tests set.
 *
 * Why this exists rather than an emulator: MSW intercepts HTTP, and the Firestore admin
 * SDK talks gRPC, so the network boundary this codebase substitutes everywhere else is
 * not available here. The official answer is the Firestore emulator, which needs Java.
 * `FIRESTORE_EMULATOR_HOST` still works with no code change for anyone who has it — this
 * driver is the zero-install default, not a replacement for it.
 *
 * It implements only the surface the app actually uses, enumerated from the codebase:
 *
 *   collection(n).doc(id).get() / .set() / .update() / .delete()
 *   collection(n).select().get()          -- clear-service.ts, ids only
 *   collection(n).count().get()           -- fpl-firestore.ts
 *   collection(n).limit(1).get()          -- system-status.service.ts
 *   collection(n).where(f, op, v).get()   -- firestore-client.ts
 *   db.getAll(...refs)                    -- firestore-client.ts
 *   db.batch().set() / .update() / .delete() / .commit()
 *
 * Anything outside that throws rather than returning something plausible, so a new call
 * site shows up as a loud failure in the harness instead of silently reading empty data.
 *
 * **What it does not reproduce** (see `.kiro/testing-progress.md`, G19): `Timestamp`
 * values -- writes go through a JSON round-trip, so a `Date` comes back as an ISO string
 * rather than a `Timestamp` with `.toDate()`. `fpl-firestore.ts:62-72` handles both, which
 * is why events survive the difference, but a new caller relying on `.toDate()` would pass
 * here and fail in production. Also absent: `getAll` batch limits, transactions, latency,
 * and any of Firestore's own validation beyond what JSON serialisation catches.
 */

type StoredDoc = Record<string, unknown>;
type WhereFilterOp = FirebaseFirestore.WhereFilterOp;

interface Filter {
    field: string;
    op: WhereFilterOp;
    value: unknown;
}

/**
 * Values are stored as they would survive the wire.
 *
 * Real Firestore serialises writes, so a `Date` does not come back as the same object and
 * a class instance comes back as a plain one. Doing the same here means shape drift shows
 * up in the harness rather than only in production -- and it doubles as the defensive copy
 * that stops a caller mutating the store through a value it read.
 */
function serialise(value: unknown, context: string): StoredDoc {
    if (value === undefined || value === null) {
        throw new Error(`[fixture-firestore] ${context}: cannot write ${String(value)} as a document`);
    }

    const json = JSON.stringify(value);
    if (json === undefined) {
        throw new Error(`[fixture-firestore] ${context}: value is not serialisable`);
    }

    return JSON.parse(json) as StoredDoc;
}

function readPath(doc: StoredDoc, path: string): unknown {
    return path.split('.').reduce<unknown>((value, segment) => {
        if (value === null || typeof value !== 'object') return undefined;
        return (value as Record<string, unknown>)[segment];
    }, doc);
}

function sameValue(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    return JSON.stringify(a) === JSON.stringify(b);
}

function compare(actual: unknown, expected: unknown): number | null {
    if (typeof actual === 'number' && typeof expected === 'number') return actual - expected;
    if (typeof actual === 'string' && typeof expected === 'string') {
        return actual < expected ? -1 : actual > expected ? 1 : 0;
    }
    return null;
}

function matchesFilter(doc: StoredDoc, { field, op, value }: Filter): boolean {
    const actual = readPath(doc, field);

    switch (op) {
        case '==':
            return sameValue(actual, value);
        case '!=':
            return !sameValue(actual, value);
        case 'in':
            return Array.isArray(value) && value.some((candidate) => sameValue(actual, candidate));
        case 'not-in':
            return Array.isArray(value) && !value.some((candidate) => sameValue(actual, candidate));
        case 'array-contains':
            return Array.isArray(actual) && actual.some((entry) => sameValue(entry, value));
        case 'array-contains-any':
            return (
                Array.isArray(actual) &&
                Array.isArray(value) &&
                value.some((candidate) => actual.some((entry) => sameValue(entry, candidate)))
            );
        default: {
            const ordering = compare(actual, value);
            if (ordering === null) return false;
            if (op === '<') return ordering < 0;
            if (op === '<=') return ordering <= 0;
            if (op === '>') return ordering > 0;
            if (op === '>=') return ordering >= 0;
            throw new Error(`[fixture-firestore] unsupported where operator: ${op}`);
        }
    }
}

function project(doc: StoredDoc, fields: string[] | null): StoredDoc {
    if (fields === null) return doc;

    const projected: StoredDoc = {};
    for (const field of fields) {
        const value = readPath(doc, field);
        if (value !== undefined) projected[field] = value;
    }
    return projected;
}

/** The documents themselves: collection name -> document id -> document. */
class MemoryStore {
    private readonly collections = new Map<string, Map<string, StoredDoc>>();

    collection(name: string): Map<string, StoredDoc> {
        const existing = this.collections.get(name);
        if (existing) return existing;

        const created = new Map<string, StoredDoc>();
        this.collections.set(name, created);
        return created;
    }

    /**
     * Document ids, ordered. Firestore's default ordering is by `__name__`, so sorting
     * here is what makes an unordered query return the same rows in the same order it
     * would live -- and what makes a harness run reproducible.
     */
    ids(name: string): string[] {
        return [...this.collection(name).keys()].sort();
    }

    clear(): void {
        this.collections.clear();
    }

    toJSON(): Record<string, Record<string, StoredDoc>> {
        return Object.fromEntries(
            [...this.collections.entries()].map(([name, docs]) => [name, Object.fromEntries(docs)]),
        );
    }

    load(data: Record<string, Record<string, StoredDoc>>): void {
        this.collections.clear();
        for (const [name, docs] of Object.entries(data)) {
            this.collections.set(name, new Map(Object.entries(docs)));
        }
    }
}

class MemoryDocumentSnapshot {
    constructor(
        readonly id: string,
        readonly ref: MemoryDocumentReference,
        private readonly stored: StoredDoc | undefined,
    ) {}

    get exists(): boolean {
        return this.stored !== undefined;
    }

    data(): StoredDoc | undefined {
        return this.stored === undefined ? undefined : structuredClone(this.stored);
    }

    get(field: string): unknown {
        return this.stored === undefined ? undefined : readPath(this.stored, field);
    }
}

class MemoryQuerySnapshot {
    constructor(readonly docs: MemoryDocumentSnapshot[]) {}

    get size(): number {
        return this.docs.length;
    }

    get empty(): boolean {
        return this.docs.length === 0;
    }

    forEach(callback: (doc: MemoryDocumentSnapshot) => void): void {
        this.docs.forEach(callback);
    }
}

class MemoryQuery {
    constructor(
        protected readonly store: MemoryStore,
        readonly collectionName: string,
        private readonly filters: Filter[] = [],
        private readonly limitCount: number | null = null,
        private readonly selected: string[] | null = null,
    ) {}

    where(field: string, op: WhereFilterOp, value: unknown): MemoryQuery {
        return new MemoryQuery(
            this.store,
            this.collectionName,
            [...this.filters, { field, op, value }],
            this.limitCount,
            this.selected,
        );
    }

    limit(count: number): MemoryQuery {
        return new MemoryQuery(this.store, this.collectionName, this.filters, count, this.selected);
    }

    /** `select()` with no arguments is the ids-only read `clear-service.ts` uses. */
    select(...fields: string[]): MemoryQuery {
        return new MemoryQuery(this.store, this.collectionName, this.filters, this.limitCount, fields);
    }

    count(): { get: () => Promise<{ data: () => { count: number } }> } {
        return {
            get: async () => {
                const matched = this.matchingIds();
                return { data: () => ({ count: matched.length }) };
            },
        };
    }

    async get(): Promise<MemoryQuerySnapshot> {
        const docs = this.matchingIds().map((id) => {
            const stored = this.store.collection(this.collectionName).get(id) as StoredDoc;
            return new MemoryDocumentSnapshot(
                id,
                new MemoryDocumentReference(this.store, this.collectionName, id),
                project(stored, this.selected),
            );
        });

        return new MemoryQuerySnapshot(docs);
    }

    private matchingIds(): string[] {
        const documents = this.store.collection(this.collectionName);
        const matched = this.store
            .ids(this.collectionName)
            .filter((id) => this.filters.every((filter) => matchesFilter(documents.get(id) as StoredDoc, filter)));

        return this.limitCount === null ? matched : matched.slice(0, this.limitCount);
    }
}

class MemoryDocumentReference {
    constructor(
        private readonly store: MemoryStore,
        readonly collectionName: string,
        readonly id: string,
    ) {}

    get path(): string {
        return `${this.collectionName}/${this.id}`;
    }

    async get(): Promise<MemoryDocumentSnapshot> {
        return new MemoryDocumentSnapshot(this.id, this, this.store.collection(this.collectionName).get(this.id));
    }

    async set(data: unknown): Promise<{ writeTime: null }> {
        this.applySet(data);
        return { writeTime: null };
    }

    /**
     * Firestore's `update` merges into an existing document and rejects a missing one.
     * Both halves matter: `updateDivisionTeamsDocument` relies on the merge, and a caller
     * that updates before creating should fail here exactly as it does live.
     */
    async update(data: unknown): Promise<{ writeTime: null }> {
        this.applyUpdate(data);
        return { writeTime: null };
    }

    async delete(): Promise<{ writeTime: null }> {
        this.applyDelete();
        return { writeTime: null };
    }

    applySet(data: unknown): void {
        this.store.collection(this.collectionName).set(this.id, serialise(data, `set ${this.path}`));
    }

    applyUpdate(data: unknown): void {
        const documents = this.store.collection(this.collectionName);
        const existing = documents.get(this.id);
        if (!existing) {
            throw new Error(`[fixture-firestore] update on a document that does not exist: ${this.path}`);
        }

        const patch = serialise(data, `update ${this.path}`);
        const dotted = Object.keys(patch).find((key) => key.includes('.'));
        if (dotted) {
            throw new Error(
                `[fixture-firestore] update ${this.path}: dotted field paths are not implemented (got "${dotted}")`,
            );
        }

        documents.set(this.id, { ...existing, ...patch });
    }

    applyDelete(): void {
        this.store.collection(this.collectionName).delete(this.id);
    }
}

class MemoryCollectionReference extends MemoryQuery {
    doc(id: string): MemoryDocumentReference {
        return new MemoryDocumentReference(this.store, this.collectionName, id);
    }
}

class MemoryWriteBatch {
    private readonly operations: Array<() => void> = [];

    set(ref: MemoryDocumentReference, data: unknown): MemoryWriteBatch {
        this.operations.push(() => ref.applySet(data));
        return this;
    }

    update(ref: MemoryDocumentReference, data: unknown): MemoryWriteBatch {
        this.operations.push(() => ref.applyUpdate(data));
        return this;
    }

    delete(ref: MemoryDocumentReference): MemoryWriteBatch {
        this.operations.push(() => ref.applyDelete());
        return this;
    }

    async commit(): Promise<Array<{ writeTime: null }>> {
        // A real batch is atomic; applying after the loop of pushes is close enough,
        // since nothing here can fail halfway except an update on a missing document.
        this.operations.forEach((apply) => apply());
        return this.operations.map(() => ({ writeTime: null }));
    }
}

class MemoryFirestore {
    readonly store = new MemoryStore();

    collection(name: string): MemoryCollectionReference {
        return new MemoryCollectionReference(this.store, name);
    }

    async getAll(...refs: MemoryDocumentReference[]): Promise<MemoryDocumentSnapshot[]> {
        return Promise.all(refs.map((ref) => ref.get()));
    }

    batch(): MemoryWriteBatch {
        return new MemoryWriteBatch();
    }
}

/**
 * The app types `db` as `FirebaseFirestore.Firestore`, and this implements a deliberate
 * subset of it (see the file header), so the structural types cannot line up. One cast,
 * here, rather than a cast at every call site.
 */
function asFirestore(instance: MemoryFirestore): FirebaseFirestore.Firestore {
    return instance as unknown as FirebaseFirestore.Firestore;
}

export function createInMemoryFirestore(): FirebaseFirestore.Firestore {
    return asFirestore(new MemoryFirestore());
}

let singleton: MemoryFirestore | undefined;

function instance(): MemoryFirestore {
    if (!singleton) singleton = new MemoryFirestore();
    return singleton;
}

/** The process-wide instance `getFirestoreInstance()` hands out under the fixture flag. */
export function getInMemoryFirestore(): FirebaseFirestore.Firestore {
    return asFirestore(instance());
}

/** Drop every document. Call between scenarios so one does not leak into the next. */
export function resetInMemoryFirestore(): void {
    instance().store.clear();
}

/**
 * The whole database as plain JSON, and back.
 *
 * Rebuilding the season takes seconds, so the fixture server persists the result to
 * `.harness/` and reloads it. Reading and writing that file is the harness's job -- this
 * module stays free of `fs` so it can also run in a test worker.
 */
export function dumpInMemoryFirestore(): Record<string, Record<string, StoredDoc>> {
    return instance().store.toJSON();
}

export function loadInMemoryFirestore(data: Record<string, Record<string, StoredDoc>>): void {
    instance().store.load(data);
}
