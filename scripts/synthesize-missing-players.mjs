/**
 * One-time polyfill for the rostered players that have no per-gameweek stats anywhere.
 *
 * WHY THIS EXISTS
 *
 * The test harness pairs the 2425 FPL capture (a complete finished season: 38 events, 721
 * element-summaries with real per-gameweek history) with the 2526 sheets capture (the current
 * schema: 288 draft picks, 847 transfers). Twelve rostered players arrived in the Premier
 * League in summer 2025, so they exist in the 2526 sheets but not in the 2425 FPL pool, and
 * the 2526 FPL capture is a pre-season snapshot whose `history` arrays are all empty. Without
 * this file those twelve roster slots score 0 for the whole season and their player pages show
 * nothing.
 *
 * WHAT IS REAL AND WHAT IS NOT
 *
 *   REAL — identity (code, names, team, position) from the 2526 bootstrap and `Players` sheet.
 *   REAL — 2025/26 SEASON TOTALS from the `FPL_Player_export` sheet: minutes, goals, assists,
 *          clean sheets, goals conceded, cards, saves, bonus, bps.
 *   ZERO — `defensive_contribution`. The sheet has the column but never populated it (0 for every
 *          player, all positions), and FPL exposes no element-level total for the raw components.
 *   INVENTED — the distribution of those totals across gameweeks. The season aggregate is
 *          preserved exactly; which gameweek a goal landed in is made up, deterministically.
 *
 * So: never use these files to verify a scoring calculation or a historical result. They exist
 * to make rosters complete and pages renderable. `scoring/lib/calculations.test.ts` is what
 * proves the maths.
 *
 * Opponents and home/away come from the real 2425 fixture list for the player's club, so the
 * player page shows plausible fixtures. A club that was not in the Premier League in 2024/25
 * gets `opponent_team: 0`, which the page renders as "Unknown".
 *
 * Usage:  node scripts/synthesize-missing-players.mjs   (needs archive/ present locally)
 * Output: test-fixtures/fpl/synthetic-elements.json
 *         test-fixtures/fpl/element-summary/<id>.json
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syntheticDefensiveStats } from './lib/synthetic-defensive-stats.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Sheets are tracked in `test-fixtures/`; the raw FPL captures are in gitignored `archive/`,
 * which is why this script is a regeneration tool rather than something CI runs. Its output is
 * committed. See archive/README.md.
 */
const SHEETS = join(REPO_ROOT, 'test-fixtures/spreadsheets');
const ARCHIVE = join(REPO_ROOT, 'archive');
const EXTRACTED = join(REPO_ROOT, 'test-fixtures/fpl');
const OUT_ROOT = join(REPO_ROOT, 'test-fixtures/fpl');

/** A donor must be a squad regular, not a bit-part player or an ever-present star. */
const DONOR_MIN_MINUTES = 1500;

/**
 * Ids are allocated above 2425's highest element id (804) so a merged pool has no collisions.
 * Fixed and committed rather than computed at harness time, so a roster slot always refers to
 * the same synthetic player across runs.
 */
const FIRST_SYNTHETIC_ID = 805;

const TOTAL_GAMEWEEKS = 38;
const MINUTES_PER_APPEARANCE = 90;

const readSheet = (name) => JSON.parse(readFileSync(join(SHEETS, name), 'utf8')).values;
const readFpl = (season, name) => JSON.parse(readFileSync(join(ARCHIVE, season, 'fpl', name), 'utf8'));

const indexBy = (header) => Object.fromEntries(header.map((name, i) => [name, i]));

const TRANSFER_TABS = ['premier-league-transfers.json', 'championship-transfers.json', 'league-one-transfers.json'];
const APPROVED = 'Y';

/**
 * Every player who was on a roster at any point in the season: drafted, or transferred in and
 * approved. Draft picks reference players by `code` (`Player ID` is empty for every row), and so do
 * transfers, via `Code In`.
 *
 * The draft alone is not enough — 42 of the players needing synthesis arrived by transfer, several
 * of them playing near-full seasons (Truffert 3378 minutes, Xhaka 2901).
 */
function everRosteredCodes() {
    const draft = readSheet('draft.json');
    const draftCol = indexBy(draft[0]);
    const codes = new Set(draft.slice(1).map((row) => Number(row[draftCol.Code])).filter(Boolean));

    for (const tab of TRANSFER_TABS) {
        const rows = readSheet(tab);
        const col = indexBy(rows[0]);
        for (const row of rows.slice(1)) {
            const codeIn = Number(row[col['Code In']]);
            if (codeIn && String(row[col.Status]) === APPROVED) codes.add(codeIn);
        }
    }
    return codes;
}

/** Name and position for a player with no row in the export — enough to resolve a roster slot. */
function identityFromSheets() {
    const rows = readSheet('players.json');
    const col = indexBy(rows[0]);
    const byCode = new Map();
    for (const row of rows.slice(1)) {
        const code = Number(row[col.code]);
        if (code) byCode.set(code, String(row[col.web_name] ?? ''));
    }
    return byCode;
}

/** Season totals, keyed by code. The only real per-player numbers available for these twelve. */
function seasonTotalsByCode() {
    const rows = readSheet('fpl-player-export.json');
    const col = indexBy(rows[0]);
    const num = (row, name) => Number(row[col[name]]) || 0;

    return new Map(
        rows.slice(1).map((row) => [
            Number(row[col.code]),
            {
                webName: String(row[col.web_name] ?? ''),
                firstName: String(row[col.first_name] ?? ''),
                secondName: String(row[col.second_name] ?? ''),
                teamCode: String(row[col.team_code] ?? ''),
                status: String(row[col.status] ?? 'a'),
                nowCost: num(row, 'now_cost'),
                totals: {
                    minutes: num(row, 'minutes'),
                    goals_scored: num(row, 'goals_scored'),
                    assists: num(row, 'assists'),
                    clean_sheets: num(row, 'clean_sheets'),
                    goals_conceded: num(row, 'goals_conceded'),
                    own_goals: num(row, 'own_goals'),
                    penalties_saved: num(row, 'penalties_saved'),
                    penalties_missed: num(row, 'penalties_missed'),
                    yellow_cards: num(row, 'yellow_cards'),
                    red_cards: num(row, 'red_cards'),
                    saves: num(row, 'saves'),
                    bonus: num(row, 'bonus'),
                    bps: num(row, 'bps'),
                    total_points: num(row, 'total_points'),
                },
            },
        ]),
    );
}

/** Custom position (`gk`/`fb`/`cb`/`mid`/`wa`/`ca`) comes from the `Players` sheet, not FPL. */
function positionsByCode() {
    const rows = readSheet('players.json');
    const col = indexBy(rows[0]);
    return new Map(rows.slice(1).map((row) => [Number(row[col.code]), String(row[col.position] ?? '').toLowerCase()]));
}

/**
 * A stand-in season for the players with no statistics anywhere: the **median** real 2024/25 season
 * for their position, among squad regulars.
 *
 * Eight rostered players fall in the gap between both captures — not in the Premier League in
 * 2024/25, gone again before the 26/27 export — so unlike everyone else there is no aggregate to
 * preserve, not even a season total. But they are not ignorable: seven of the eight hold roster
 * slots for months and two are still owned at GW38, so leaving them on zero understates their
 * managers' totals in a way that reads like a scoring bug.
 *
 * Copying a real median season gives realistic match-to-match variance, and `standInFor` records
 * whose season it was, so any figure can be traced. It is still invented data: it is a typical
 * season for the position, not what the player actually did.
 *
 * Requires the extracted 2024/25 slice, so run `extract-harness-stats.mjs` first.
 */
function medianDonorByPosition(positions) {
    const summaryDir = join(EXTRACTED, 'element-summary');
    if (!existsSync(summaryDir)) {
        console.error(`✖ ${summaryDir} not found — run scripts/extract-harness-stats.mjs first`);
        process.exit(1);
    }

    const codeById = new Map(
        JSON.parse(readFileSync(join(EXTRACTED, 'bootstrap-static.json'), 'utf8')).elements.map((e) => [e.id, e.code]),
    );

    const candidates = {};
    for (const file of readdirSync(summaryDir)) {
        const id = Number(file.replace('.json', ''));
        const position = positions.get(codeById.get(id));
        if (!position) continue;

        const { history } = JSON.parse(readFileSync(join(summaryDir, file), 'utf8'));
        const minutes = history.reduce((total, row) => total + row.minutes, 0);
        if (minutes < DONOR_MIN_MINUTES) continue;

        (candidates[position] ??= []).push({ id, history, points: history.reduce((t, r) => t + r.total_points, 0) });
    }

    const donors = new Map();
    for (const [position, list] of Object.entries(candidates)) {
        list.sort((a, b) => a.points - b.points);
        donors.set(position, list[Math.floor(list.length / 2)]);
    }
    return donors;
}

/** Re-key a donor's season onto the stand-in, with defensive stats seeded by their own id. */
function standInHistory(donor, elementId, position) {
    return donor.history.map((row) => ({
        ...row,
        element: elementId,
        ...syntheticDefensiveStats({ elementId, round: row.round, minutes: row.minutes, position }),
        synthetic: true,
        standInFor: donor.id,
    }));
}

/**
 * Which gameweeks a player appeared in: evenly spaced, as many as their minutes imply.
 * Deterministic, so regenerating produces byte-identical files.
 */
function appearanceGameweeks(totalMinutes) {
    const appearances = Math.min(TOTAL_GAMEWEEKS, Math.max(1, Math.round(totalMinutes / MINUTES_PER_APPEARANCE)));
    const step = TOTAL_GAMEWEEKS / appearances;
    return Array.from({ length: appearances }, (_, i) => Math.min(TOTAL_GAMEWEEKS, Math.floor(i * step) + 1));
}

/** Spread a whole-number total across n buckets, remainder to the earliest buckets. */
function spread(total, n) {
    const base = Math.floor(total / n);
    const remainder = total % n;
    return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Real 2024/25 opponents for a club, so the player page shows plausible fixtures. */
function fixtureLookup(teamCode) {
    const bootstrap = readFpl('2425', 'bootstrap-static.json');
    const team = bootstrap.teams.find((t) => t.short_name === teamCode || String(t.code) === String(teamCode));
    if (!team) return () => ({ opponent_team: 0, was_home: true });

    const fixtures = readFpl('2425', 'fixtures.json');
    const byEvent = new Map();
    for (const fixture of fixtures) {
        if (fixture.team_h === team.id) byEvent.set(fixture.event, { opponent_team: fixture.team_a, was_home: true });
        else if (fixture.team_a === team.id) byEvent.set(fixture.event, { opponent_team: fixture.team_h, was_home: false });
    }
    return (gameweek) => byEvent.get(gameweek) ?? { opponent_team: 0, was_home: true };
}

function buildHistory(player, elementId, position) {
    const { totals } = player;
    const gameweeks = appearanceGameweeks(totals.minutes);
    const n = gameweeks.length;
    const opponentFor = fixtureLookup(player.teamCode);

    // Every countable total is spread across the appearances, so the season aggregate is exact.
    const per = Object.fromEntries(
        Object.entries(totals).map(([stat, value]) => [stat, spread(value, n)]),
    );

    return gameweeks.map((round, i) => ({
        element: elementId,
        fixture: 0,
        round,
        ...opponentFor(round),
        minutes: per.minutes[i],
        goals_scored: per.goals_scored[i],
        assists: per.assists[i],
        clean_sheets: per.clean_sheets[i],
        goals_conceded: per.goals_conceded[i],
        own_goals: per.own_goals[i],
        penalties_saved: per.penalties_saved[i],
        penalties_missed: per.penalties_missed[i],
        yellow_cards: per.yellow_cards[i],
        red_cards: per.red_cards[i],
        saves: per.saves[i],
        bonus: per.bonus[i],
        bps: per.bps[i],
        total_points: per.total_points[i],
        // Invented from position and minutes, like every other fixture — no real source exists.
        ...syntheticDefensiveStats({ elementId, round, minutes: per.minutes[i], position }),
        team_h_score: null,
        team_a_score: null,
        starts: per.minutes[i] >= 60 ? 1 : 0,
        expected_goals: '0.00',
        expected_assists: '0.00',
        expected_goal_involvements: '0.00',
        expected_goals_conceded: '0.00',
        value: player.nowCost,
        transfers_balance: 0,
        selected: 0,
        transfers_in: 0,
        transfers_out: 0,
        kickoff_time: null,
        modified: false,
        synthetic: true,
    }));
}

async function main() {
    if (!existsSync(ARCHIVE)) {
        console.error(`✖ archive not found at ${ARCHIVE}`);
        console.error('  The raw captures are gitignored. See archive/README.md.');
        process.exit(1);
    }

    const rostered = everRosteredCodes();
    const totals = seasonTotalsByCode();
    const positions = positionsByCode();
    const sheetNames = identityFromSheets();
    const donors = medianDonorByPosition(positions);
    const pool2425 = new Set(readFpl('2425', 'bootstrap-static.json').elements.map((e) => e.code));
    const bootstrap2526 = new Map(readFpl('2526', 'bootstrap-static.json').elements.map((e) => [e.code, e]));

    // Sorted so id assignment is deterministic. Note that adding a player reshuffles the ids of
    // everyone after them, so always regenerate the whole set rather than appending.
    const missing = [...rostered].filter((code) => !pool2425.has(code)).sort((a, b) => a - b);

    console.log(`${rostered.size} players were rostered at some point; ${missing.length} have no 2024/25 stats\n`);

    const elements = [];
    const statless = [];
    await mkdir(join(OUT_ROOT, 'element-summary'), { recursive: true });

    for (const [i, code] of missing.entries()) {
        const elementId = FIRST_SYNTHETIC_ID + i;
        const position = positions.get(code) ?? null;
        const player = totals.get(code);
        const source = bootstrap2526.get(code);

        // No export row, or a row with no minutes: nothing real to distribute. These eight still
        // occupy roster slots for months, so they get a stand-in season — the median real 2024/25
        // season for their position — rather than zeros that would understate their managers.
        const hasSeason = Boolean(player) && player.totals.minutes > 0;
        const donor = hasSeason ? null : donors.get(position);
        const history = hasSeason
            ? buildHistory(player, elementId, position)
            : donor
              ? standInHistory(donor, elementId, position)
              : [];

        elements.push({
            id: elementId,
            code,
            first_name: player?.firstName ?? '',
            second_name: player?.secondName ?? '',
            web_name: player?.webName || sheetNames.get(code) || String(code),
            team_code: source?.team_code ?? 0,
            team: source?.team ?? 0,
            element_type: source?.element_type ?? 0,
            now_cost: player?.nowCost ?? 0,
            status: player?.status ?? 'u',
            form: '0.0',
            total_points: player?.totals.total_points ?? 0,
            draftPosition: position,
            synthetic: true,
            // A stand-in has no season of its own: these stats are another player's, named here.
            standInFor: donor?.id,
            replacementLevel: hasSeason ? undefined : true,
        });

        await writeFile(
            join(OUT_ROOT, 'element-summary', `${elementId}.json`),
            `${JSON.stringify({ syntheticDefensiveStats: true, fixtures: [], history }, null, 2)}\n`,
        );

        const name = player?.webName || sheetNames.get(code) || String(code);
        if (hasSeason) {
            console.log(
                `  ${String(elementId).padEnd(4)} ${name.padEnd(14)} ${String(position).padEnd(4)}` +
                    ` ${String(history.length).padEnd(3)} apps, ${player.totals.minutes} mins,` +
                    ` ${player.totals.goals_scored}g ${player.totals.assists}a`,
            );
        } else {
            const apps = history.filter((row) => row.minutes > 0).length;
            statless.push(`${name} → stand-in ${donor?.id ?? 'none'} (${apps} apps)`);
        }
    }

    await writeFile(
        join(OUT_ROOT, 'synthetic-elements.json'),
        `${JSON.stringify(
            {
                note: 'Season totals are real; per-gameweek distribution and all defensive stats are invented. See scripts/synthesize-missing-players.mjs',
                elements,
            },
            null,
            2,
        )}\n`,
    );

    if (statless.length) {
        console.log(`\n  ${statless.length} rostered players have no season data anywhere — given a median`);
        console.log('  stand-in season for their position, traceable via `standInFor`:');
        for (const line of statless) console.log(`    ${line}`);
    }

    console.log(`\n✓ ${elements.length} synthetic players written to test-fixtures/fpl/`);
}

await main();
