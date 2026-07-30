/**
 * Extracts the slice of the raw FPL capture that the test harness needs, from the
 * gitignored `archive/` into tracked `test-fixtures/`.
 *
 * WHY THIS EXISTS
 *
 * `archive/` holds 57MB of raw captures and is not in git — too big, and no longer imported by
 * the app now that the `?source=2425` player toggle is gone. But the harness needs 2024/25
 * per-gameweek stats to rebuild a season, and CI has no archive. So the small, tracked slice
 * lives in `test-fixtures/` and this script regenerates it.
 *
 * A raw element-summary is ~36KB, of which ~15KB is fields nothing in this app reads
 * (influence, creativity, threat, ict_index, expected_*, the seven mng_* manager stats,
 * transfer churn) and ~5.6KB is `history_past`, which is typed `unknown[]` and never read.
 * Trimming to the fields the app actually consumes, for only the players in the `Players`
 * sheet, takes 40MB down to something committable.
 *
 * FOUR STATS DID NOT EXIST IN 2024/25, AND ARE SYNTHESIZED
 *
 * `clearances_blocks_interceptions`, `tackles`, `recoveries` and `defensive_contribution` are
 * 2025/26 additions, absent from every 2024/25 history row. They are **invented** here, from
 * position and minutes played, by `lib/synthetic-defensive-stats.mjs` — read that file before
 * trusting a number that depends on them.
 *
 * The reason is that `POSITION_RULES` awards defensive-contribution points and `calculations.ts`
 * computes them from these fields, so with zeros nothing can reach the rule. The cost is that
 * harness standings include invented points for every fb, cb and mid, and are therefore not a
 * faithful replay of 2024/25. Assert behaviour, never a specific total.
 *
 * Usage:  node scripts/extract-harness-stats.mjs
 * Needs:  archive/ present locally (see archive/README.md)
 */

import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syntheticDefensiveStats } from './lib/synthetic-defensive-stats.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVE = join(REPO_ROOT, 'archive/2425/fpl');
const SHEETS = join(REPO_ROOT, 'test-fixtures/spreadsheets');
const OUT = join(REPO_ROOT, 'test-fixtures/fpl');

/** Every field the app reads from a gameweek history row. Everything else is dropped. */
const KEPT_STATS = [
    'element',
    'fixture',
    'round',
    'opponent_team',
    'was_home',
    'team_h_score',
    'team_a_score',
    'total_points',
    'minutes',
    'goals_scored',
    'assists',
    'clean_sheets',
    'goals_conceded',
    'own_goals',
    'penalties_saved',
    'penalties_missed',
    'yellow_cards',
    'red_cards',
    'saves',
    'bonus',
    'bps',
    'starts',
];

/** Position by code, from the `Players` sheet — the custom position, not FPL's element_type. */
function playersSheet() {
    const rows = JSON.parse(readFileSync(join(SHEETS, 'players.json'), 'utf8')).values;
    const codeColumn = rows[0].indexOf('code');
    const positionColumn = rows[0].indexOf('position');
    const byCode = new Map();
    for (const row of rows.slice(1)) {
        const code = Number(row[codeColumn]);
        if (code) byCode.set(code, String(row[positionColumn] ?? '').toLowerCase());
    }
    return byCode;
}

function trimHistoryRow(row, elementId, position) {
    const trimmed = {};
    for (const field of KEPT_STATS) trimmed[field] = row[field] ?? null;

    // The four 2025/26 stats. Absent from 2024/25, so synthesized — see the header and
    // scripts/lib/synthetic-defensive-stats.mjs for exactly what that means.
    Object.assign(
        trimmed,
        syntheticDefensiveStats({ elementId, round: row.round, minutes: row.minutes ?? 0, position }),
    );
    return trimmed;
}

async function main() {
    if (!existsSync(ARCHIVE)) {
        console.error(`✖ archive not found at ${ARCHIVE}`);
        console.error('  The raw captures are gitignored. See archive/README.md.');
        process.exit(1);
    }

    const positionByCode = playersSheet();
    const wanted = positionByCode.keys();
    const bootstrap = JSON.parse(readFileSync(join(ARCHIVE, 'bootstrap-static.json'), 'utf8'));
    const idsByCode = new Map(bootstrap.elements.map((element) => [element.code, element.id]));

    await mkdir(join(OUT, 'element-summary'), { recursive: true });

    // Kept whole: both are small, and trimming them risks breaking a field nothing has noticed
    // it reads. `bootstrap-static` also carries the 38-event calendar the clock walks.
    await copyFile(join(ARCHIVE, 'bootstrap-static.json'), join(OUT, 'bootstrap-static.json'));
    await copyFile(join(ARCHIVE, 'fixtures.json'), join(OUT, 'fixtures.json'));

    const available = new Set((await readdir(join(ARCHIVE, 'element-summary'))).map((f) => Number(f.replace('.json', ''))));

    let written = 0;
    let rawBytes = 0;
    let trimmedBytes = 0;
    const missing = [];

    for (const code of wanted) {
        const id = idsByCode.get(code);
        if (!id || !available.has(id)) {
            missing.push(code);
            continue;
        }

        const position = positionByCode.get(code);
        const raw = readFileSync(join(ARCHIVE, 'element-summary', `${id}.json`), 'utf8');
        const summary = JSON.parse(raw);
        // `fixtures` is upcoming games — empty in a finished season, but the player page reads it.
        // `history_past` is dropped: typed `unknown[]`, never read.
        // `syntheticDefensiveStats` flags the file as carrying invented defensive actions, so a
        // reader can tell at a glance that its DC numbers are not history.
        // Minified, not pretty-printed: 404 files of generated data that nobody hand-edits, and
        // the indentation was costing more than half the bytes.
        const output = `${JSON.stringify({
            syntheticDefensiveStats: true,
            fixtures: summary.fixtures ?? [],
            history: summary.history.map((row) => trimHistoryRow(row, id, position)),
        })}\n`;

        await writeFile(join(OUT, 'element-summary', `${id}.json`), output);
        rawBytes += raw.length;
        trimmedBytes += output.length;
        written++;
    }

    const mb = (n) => `${(n / 1024 / 1024).toFixed(1)}MB`;
    console.log(`Players sheet: ${positionByCode.size} codes`);
    console.log(`  ✓ ${written} element-summaries written  ${mb(rawBytes)} -> ${mb(trimmedBytes)}`);
    console.log(`  · ${missing.length} not in the 2024/25 pool — no per-gameweek stats exist for them`);
    console.log('  ✓ bootstrap-static.json + fixtures.json copied whole');
}

await main();
