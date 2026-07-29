#!/usr/bin/env node
/**
 * A ratchet: lets an existing backlog of problems stay, but never grow.
 *
 * Why this exists: the codebase has a large backlog of type errors and CSS convention
 * violations. Fixing them all before work resumes would block everything for weeks,
 * but leaving the checks off lets the backlog keep growing. A ratchet does both --
 * the current count is committed as a baseline, and CI fails only if the count goes UP.
 *
 * Usage:
 *   node scripts/ratchet.mjs <check>            check against the committed baseline
 *   node scripts/ratchet.mjs <check> --update   record the current count as the baseline
 *   node scripts/ratchet.mjs --all              check every configured check
 *
 * When you fix things, the check tells you to re-run with --update and commit the
 * lower number. That number only ever goes down.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = resolve(repoRoot, '.ratchet.json');

/** Run a command and return its combined output, ignoring a non-zero exit. */
const run = (command) => {
    try {
        return execSync(command, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
        return `${error.stdout ?? ''}${error.stderr ?? ''}`;
    }
};

const CHECKS = {
    types: {
        label: 'TypeScript errors (draft)',
        fix: 'yarn type-check',
        count: () => run('yarn workspace draft typecheck').split('\n').filter((l) => /error TS\d+/.test(l)).length,
    },
    // The `functions` workspace was checked by NOTHING except `yarn build`, so a change
    // could be green on tests, types and lint and still break the deploy. It did: the
    // dependabot batch in 16b4953 brought in tough-cookie 6, which stopped @types/request
    // compiling, and only the build noticed.
    //
    // Unlike the others this baseline is 0 and must stay there. `functions` is four small
    // files -- there is no backlog to burn down, so anything above zero is a regression.
    functionsTypes: {
        label: 'TypeScript errors (functions)',
        fix: 'yarn workspace functions exec tsc --noEmit',
        count: () =>
            run('yarn workspace functions exec tsc --noEmit')
                .split('\n')
                .filter((l) => /error TS\d+/.test(l)).length,
    },
    css: {
        label: 'CSS convention violations',
        fix: 'yarn css:lint',
        count: () => {
            const report = run('npx stylelint "draft/app/**/*.css" --formatter json');
            const json = report.slice(report.indexOf('['));
            try {
                return JSON.parse(json).reduce((total, file) => total + file.warnings.length, 0);
            } catch {
                console.error('Could not parse the stylelint report:\n', report.slice(0, 400));
                process.exit(2);
            }
        },
    },
    lint: {
        label: 'Biome lint warnings',
        fix: 'npx biome check draft/app --max-diagnostics=400',
        // biome.json sets rules like noUnusedFunctionParameters and noUnusedVariables to
        // "warn", and Biome exits 0 on warnings -- so `biome lint` in CI passed with 280
        // of them outstanding. They were detected and then ignored. Counting them here
        // makes them behave like the other two backlogs: they can only go down.
        //
        // Errors are NOT ratcheted: `biome lint` already fails CI on those, as it should.
        count: () => {
            const report = run('npx biome check draft/app --max-diagnostics=400 --reporter=summary');
            const match = report.match(/Found (\d+) warnings?\./);
            if (!match) {
                // No warnings at all is a legitimate result; a missing count is not.
                if (/Found 0 warnings|Checked \d+ files/.test(report)) return 0;
                console.error('Could not read a warning count from Biome:\n', report.slice(-400));
                process.exit(2);
            }
            return Number(match[1]);
        },
    },
};

const readBaseline = () => {
    try {
        return JSON.parse(readFileSync(baselinePath, 'utf8'));
    } catch {
        return {};
    }
};

const args = process.argv.slice(2);
const update = args.includes('--update');
const names = args.includes('--all') ? Object.keys(CHECKS) : args.filter((a) => !a.startsWith('--'));

if (names.length === 0) {
    console.error(`Usage: node scripts/ratchet.mjs <${Object.keys(CHECKS).join('|')}|--all> [--update]`);
    process.exit(2);
}

const baseline = readBaseline();
let failed = false;

for (const name of names) {
    const check = CHECKS[name];
    if (!check) {
        console.error(`Unknown check "${name}". Available: ${Object.keys(CHECKS).join(', ')}`);
        process.exit(2);
    }

    const actual = check.count();
    const allowed = baseline[name];

    if (update) {
        baseline[name] = actual;
        console.log(`📌 ${check.label}: baseline set to ${actual}`);
        continue;
    }

    if (allowed === undefined) {
        console.error(`❌ ${check.label}: no baseline recorded. Run: node scripts/ratchet.mjs ${name} --update`);
        failed = true;
    } else if (actual > allowed) {
        console.error(
            `❌ ${check.label}: ${actual} (baseline ${allowed}) -- this change adds ${actual - allowed}.\n` +
                `   Fix them before merging. See what changed with: ${check.fix}`,
        );
        failed = true;
    } else if (actual < allowed) {
        console.log(
            `✅ ${check.label}: ${actual} (baseline ${allowed}) -- ${allowed - actual} fixed. Thank you.\n` +
                `   Lock it in: node scripts/ratchet.mjs ${name} --update  (then commit .ratchet.json)`,
        );
        failed = true;
    } else {
        console.log(`✅ ${check.label}: ${actual}, unchanged`);
    }
}

if (update) {
    writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 4)}\n`);
    console.log(`\nWrote ${baselinePath}. Commit it.`);
}

process.exit(failed ? 1 : 0);
