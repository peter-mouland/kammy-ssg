import { defineConfig } from 'vitest/config';

/**
 * Vitest reads this in preference to vite.config.ts.
 *
 * It deliberately loads no plugins. reactRouter() builds the route manifest, which a
 * test run has no use for; and @vitejs/plugin-react turns out to be unnecessary because
 * esbuild already applies the JSX transform from tsconfig's `jsx: react-jsx`. Adding it
 * also introduced a type error, being built against a different vite version than the
 * one vitest bundles its types from.
 *
 * The default environment stays `node`, which keeps the logic tests (the bulk of the
 * suite) fast. A test that renders opts in with a docblock at the top of the file:
 *
 *     // @vitest-environment happy-dom
 *
 * happy-dom rather than jsdom: it is markedly faster and covers everything this app
 * renders. If a test ever needs something it does not implement (layout measurement,
 * canvas), that file can opt into jsdom the same way.
 */
export default defineConfig({
    css: {
        modules: {
            localsConvention: 'camelCase',
        },
    },
    test: {
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        // `harness/` sits outside `app/` because it orchestrates several domains, which
        // nothing inside the app is allowed to do (architecture.test.ts, rule 1).
        include: ['app/**/*.test.{ts,tsx}', 'harness/**/*.test.ts'],
        // `*.payload.test.ts` matches the include glob but belongs to the harness project:
        // it needs a rebuilt season and MSW standing up, which `yarn test` deliberately does
        // not pay for. `yarn harness` runs those -- see vitest.harness.config.ts.
        exclude: ['**/node_modules/**', '**/dist/**', 'app/**/*.payload.test.ts'],
    },
});
