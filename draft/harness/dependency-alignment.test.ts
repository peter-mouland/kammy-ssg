/* Location: draft/harness/dependency-alignment.test.ts */

/**
 * The build workspace and the runtime workspace must agree on the packages the server
 * bundle does not bundle.
 *
 * `draft` compiles the SSR bundle but leaves `react`, `react-dom/server` and `react-router`
 * as external imports, so in production they resolve from `functions/node_modules` instead.
 * Nothing checked that the two agreed, and they had drifted a long way:
 *
 *   package                draft (build)   functions (runtime)
 *   react                  19.2.1          18.3.1
 *   react-router           7.10.1          7.6.1
 *   @react-router/node     7.10.1          7.18.1
 *
 * A bundle built against react-router 7.10.1 was therefore executed by 7.6.1, whose
 * `singleFetchAction` still used the older `unstable_respond` protocol. Every fetcher
 * submission on `/admin` came back `Error: Bad Request` — in production only, because
 * every local mode runs the build workspace's own copies.
 *
 * Caret ranges are what let it drift: `functions` asked for `^7.0.0` and got whatever was
 * newest whenever its lockfile last moved, while `draft` asked for `^7.10.1`. So this
 * asserts both that the versions match and that they are pinned exactly.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Left external by the SSR build, so the runtime copy is the one that actually executes.
 * Verified against `build/server/index.js`'s bare imports.
 */
const EXTERNALISED = ['react', 'react-dom', 'react-router', '@react-router/express', '@react-router/node'];

const ROOT = join(import.meta.dirname, '..', '..');

const declared = (workspace: string): Record<string, string> => {
    const pkg = JSON.parse(readFileSync(join(ROOT, workspace, 'package.json'), 'utf8'));
    return { ...pkg.dependencies, ...pkg.devDependencies };
};

const draft = declared('draft');
const functions = declared('functions');

describe('the build and runtime workspaces agree on externalised packages', () => {
    it.each(EXTERNALISED)('%s is declared at the same version in both workspaces', (name) => {
        // Only meaningful where both declare it; a package one workspace does not use is fine.
        if (!draft[name] || !functions[name]) return;

        expect(functions[name], `functions must run the ${name} that draft builds against`).toBe(draft[name]);
    });

    it.each(EXTERNALISED)('%s is pinned exactly, not to a range', (name) => {
        for (const [workspace, deps] of [
            ['draft', draft],
            ['functions', functions],
        ] as const) {
            const version = deps[name];
            if (!version) continue;

            expect(version, `${workspace} must pin ${name} exactly — a range lets the runtime drift`).toMatch(
                /^\d+\.\d+\.\d+$/,
            );
        }
    });
});
