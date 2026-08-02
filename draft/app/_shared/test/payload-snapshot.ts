/* Location: app/_shared/test/payload-snapshot.ts */

/**
 * Committed loader payloads, so a change that silently alters what a page receives fails.
 *
 * A payload test asserting only the values it thought to name will miss the field somebody
 * removed. Committing the whole shape catches that, and the diff says exactly what moved.
 *
 * ```
 * UPDATE_STORY_DATA=1 yarn harness    # rewrite the committed files
 * yarn harness                        # they must still match
 * ```
 *
 * **Shape, not values.** What is committed is the payload with its *leaves replaced by their
 * types* and its arrays collapsed to a length plus the shape of the first element. Two
 * reasons, and the second is the one that matters:
 *
 * 1. A full standings payload is megabytes. Nobody reviews a megabyte of JSON, so a diff
 *    nobody can read is not a regression net — it is noise that gets `--update`d away.
 * 2. **The four defensive stats are invented for every player in the fixtures**, so exact
 *    points totals are meaningless and asserting them would pin fiction. `test-fixtures/`
 *    says this outright, and the handover repeats it.
 *
 * Values that decide what a page *shows* — the current gameweek, whether the cup is open,
 * which stage it is at, how many rows a table has — belong in the test itself, next to the
 * assertion, where a reader can see cause and effect. Several are asserted that way already.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { expect } from 'vitest';

const STORY_DATA_DIR = join(import.meta.dirname, 'story-data');

/** Array length is included because "the table lost a row" is exactly the regression. */
type Shape = string | number | { [key: string]: Shape } | [`array(${number})` | `record(${number})`, Shape?];

/** Above this many keys, an object is treated as a lookup rather than a structure. */
const RECORD_KEY_LIMIT = 20;

function shapeOf(value: unknown, depth = 0): Shape {
    if (depth > 12) return 'depth-capped';
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    if (Array.isArray(value)) {
        // The first element stands for the rest: these arrays are homogeneous, and one
        // sample is enough to notice a field appearing or disappearing.
        return value.length === 0 ? ['array(0)'] : [`array(${value.length})`, shapeOf(value[0], depth + 1)];
    }

    if (value instanceof Date) return 'Date';

    if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1));

        // A lookup keyed by id -- `fplPlayersByCode`, `teamsByCode` -- is data wearing an
        // object's clothes. Expanding all 458 keys produced an 8MB shape file per scenario:
        // unreviewable, and it would have churned on every fixture edit. Collapsed like an
        // array, so the count still moves if the lookup gains or loses entries.
        if (entries.length > RECORD_KEY_LIMIT) {
            return [`record(${entries.length})`, shapeOf(entries[0][1], depth + 1)];
        }

        return Object.fromEntries(entries.map(([key, nested]) => [key, shapeOf(nested, depth + 1)] as const));
    }

    return typeof value;
}

/**
 * Assert a payload still has the shape committed for this route and scenario.
 *
 * Writes the file instead when `UPDATE_STORY_DATA=1`, and writes it on first run so a new
 * route does not need a separate bootstrapping step — a missing file is a new test, not a
 * failure, and it shows up as an untracked file in the diff for review.
 */
export async function expectPayloadMatches(route: string, scenarioName: string, payload: unknown): Promise<void> {
    const file = join(STORY_DATA_DIR, `${route}.${scenarioName}.json`);
    const shape = `${JSON.stringify(shapeOf(payload), null, 2)}\n`;

    if (process.env.UPDATE_STORY_DATA === '1' || !existsSync(file)) {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, shape);
        return;
    }

    expect(shape, `${route}.${scenarioName} payload changed — re-run with UPDATE_STORY_DATA=1 if intended`).toBe(
        readFileSync(file, 'utf8'),
    );
}
