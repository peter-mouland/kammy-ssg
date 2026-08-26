/* Location: app/_shared/test/sheet-store.ts */

/**
 * The in-memory, writable sheet the two MSW layers serve from.
 *
 * Shared for the same reason `sheet-range.ts` is: `google-sheets-msw.ts` (hand-written
 * rows, for unit tests) and `fixtures/fixture-msw-handlers.ts` (captured tabs, for the
 * harness) both have to behave like the Sheets API on a write. `update`'s splice-in-place
 * rule in particular is subtle enough that two independent implementations of it would
 * eventually disagree, and the layer that disagreed would be the one you trusted.
 *
 * Only the seeding differs: the harness loads a tab off disk, a unit test hands its rows
 * in directly. That is the one method a subclass supplies.
 */

export type SheetCell = string | number | boolean;

export abstract class SheetStore {
    private readonly tabs = new Map<string, SheetCell[][]>();

    /**
     * The tab's starting rows, header included, the first time it is touched. Copies are
     * made by the caller of this method, so an implementation may return the source rows.
     */
    protected abstract seed(tab: string): SheetCell[][];

    /** A tab's rows, header included. Seeded on first use, mutated in place after. */
    values(tab: string): SheetCell[][] {
        const loaded = this.tabs.get(tab);
        if (loaded) return loaded;

        const rows = this.seed(tab).map((row) => [...row]);
        this.tabs.set(tab, rows);
        return rows;
    }

    /** `values.append` -- what a transfer, a cup submission or a new player does. */
    append(tab: string, rows: SheetCell[][]): void {
        this.values(tab).push(...rows.map((row) => [...row]));
    }

    /**
     * `values.update` -- writes rows starting at `startRow` (1-based).
     *
     * It splices in place and does **not** truncate what follows, matching the real API:
     * an update to `'Cup'!A:G` overwrites from row 1 and leaves any longer tail alone. Two
     * callers depend on the row-targeted form to change one record --
     * `sheets/draft.ts:330` and `transfers-admin.server.tsx:267`, the latter being how a
     * transfer is approved.
     */
    update(tab: string, startRow: number, rows: SheetCell[][]): void {
        const existing = this.values(tab);
        const offset = Math.max(0, startRow - 1);

        rows.forEach((row, index) => {
            existing[offset + index] = [...row];
        });
    }

    /** Back to the seeded rows, for the next scenario. */
    reset(): void {
        this.tabs.clear();
    }

    /** Which tabs have been touched -- useful when a test wants to assert a write landed. */
    loadedTabs(): string[] {
        return [...this.tabs.keys()].sort();
    }
}

/**
 * A store seeded from rows a test wrote by hand.
 *
 * An unknown tab seeds empty rather than throwing, because a unit test declares only the
 * tabs it cares about and the code under test may legitimately read others.
 */
export class RecordSheetStore extends SheetStore {
    constructor(private readonly source: Record<string, SheetCell[][]>) {
        super();
    }

    protected seed(tab: string): SheetCell[][] {
        return this.source[tab] ?? [];
    }
}
