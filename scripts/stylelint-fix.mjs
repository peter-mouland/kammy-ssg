#!/usr/bin/env node
/**
 * Run `stylelint --fix` over the staged CSS files, repair what can be repaired, and
 * always exit 0.
 *
 * Why it never fails the commit: the repo carries a backlog of CSS convention
 * violations (see .ratchet.json). A plain `stylelint --fix` in the pre-commit hook
 * exits non-zero on any violation it could not fix -- including ones that were already
 * in the file before you touched it. That makes every legacy CSS file uncommittable
 * until its whole backlog is cleared, which is not a reasonable thing to ask of someone
 * changing one line.
 *
 * The gate is `yarn ratchet` in CI: it counts violations across the WHOLE repo, so a
 * change cannot add one without failing, and it cannot be dodged by not staging a file.
 */

import { spawnSync } from 'node:child_process';

const files = process.argv.slice(2);
if (files.length === 0) process.exit(0);

const result = spawnSync('npx', ['stylelint', '--fix', '--allow-empty-input', ...files], {
    stdio: ['ignore', 'inherit', 'inherit'],
});

if (result.status !== 0) {
    console.log(
        '\nℹ️  stylelint fixed what it could. The problems above are pre-existing and do\n' +
            '   not block this commit. `yarn ratchet` is what stops the count going up.\n',
    );
}

process.exit(0);
