import { defineConfig } from 'vitest/config';

/**
 * The payload-test project: real loaders, real data, one rebuilt season.
 *
 * Separate from `vitest.config.ts` because these need state the ordinary suite does not —
 * a season rebuilt into the in-memory Firestore, which costs ~7s. `yarn test` stays as fast
 * as it is; `yarn harness` runs these.
 *
 * `singleFork` + `isolate: false` are load-bearing, not tuning. The in-memory Firestore and
 * the clock are module singletons, so the tests have to share a module graph with the
 * rebuild that populated them — separate workers would each get an empty database, and
 * per-file isolation would re-run the rebuild for every file.
 */
export default defineConfig({
    css: {
        modules: {
            localsConvention: 'camelCase',
        },
    },
    test: {
        environment: 'node',
        setupFiles: ['./vitest.setup.ts', './vitest.harness.setup.ts'],
        include: ['app/**/*.payload.test.ts'],
        pool: 'forks',
        poolOptions: { forks: { singleFork: true } },
        isolate: false,
        fileParallelism: false,
        // The first file waits on the season rebuild.
        testTimeout: 60_000,
        hookTimeout: 180_000,
    },
});
