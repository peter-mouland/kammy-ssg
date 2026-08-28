/* Location: draft/harness/server.mjs */

/**
 * The fixture server: the real app, served entirely from `test-fixtures/`, with the date
 * in the URL.
 *
 *     yarn dev:fixtures
 *     open http://localhost:3100/?now=2025-01-10
 *
 * **What it is for.** Loading the real site gives 500s and there is no way to tell whether
 * the code broke or the data simply is not there. Here the data is known-good by
 * construction. Green here with red in production means the fault is data, not code.
 *
 * **It runs the app through Vite's SSR pipeline, not the production bundle**, which is a
 * change from the plan and the reason is worth knowing. The harness has to share three
 * pieces of module state with the app: the in-memory Firestore singleton, the clock's
 * AsyncLocalStorage, and MSW's interception. Loading the built `build/server/index.js`
 * would give it a *second* copy of every app module -- the rebuild would populate one
 * Firestore and the pages would read a different, empty one, and `runWithNow` would set a
 * date nothing could see. One module graph removes that whole class of problem.
 *
 * What still runs exactly as production does: Express, `@react-router/express`, SSR,
 * hydration, route config, loaders, actions, and the `getLoadContext: req => req.body`
 * body pass-through that is how form actions receive data on Firebase.
 */

import { createRequestHandler } from '@react-router/express';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT ?? 3100);
const NOW_COOKIE = 'kammy_now';

/**
 * Set before any app module is imported.
 *
 * `_shared/lib/sheets/utils/common.ts` reads `GOOGLE_SHEETS_ID` at module scope and
 * memoises its client, so this cannot be deferred. Nothing here is a real credential --
 * MSW answers every request before it reaches a network.
 */
function configureFixtureEnvironment() {
    process.env.KAMMY_FIXTURE_FIRESTORE = '1';
    process.env.NODE_ENV ??= 'development';
}

function parseCookies(header = '') {
    return Object.fromEntries(
        header
            .split(';')
            .map((part) => part.trim().split('='))
            .filter(([name]) => name)
            .map(([name, ...value]) => [name, decodeURIComponent(value.join('='))]),
    );
}

/**
 * Per-request time travel: `?now=<iso>` sets a cookie, and every later request on that
 * browser renders at the same date until `?now=clear`.
 *
 * The cookie is what makes the site hand-drivable -- set the date once and then click
 * around normally. `runWithNow` wraps the rest of the chain, so two browsers (or two
 * Playwright workers) can sit at two different dates against one server.
 */
function timeTravel(runWithNow) {
    return (req, res, next) => {
        const requested = typeof req.query.now === 'string' ? req.query.now : undefined;

        if (requested === 'clear') {
            res.setHeader('Set-Cookie', `${NOW_COOKIE}=; Path=/; Max-Age=0`);
            return next();
        }

        if (requested) {
            res.setHeader('Set-Cookie', `${NOW_COOKIE}=${encodeURIComponent(requested)}; Path=/; SameSite=Lax`);
        }

        const at = requested ?? parseCookies(req.headers.cookie)[NOW_COOKIE];
        if (!at) return next();

        const parsed = new Date(at);
        if (Number.isNaN(parsed.getTime())) {
            console.warn(`⚠️  ignoring unparseable ?now=${at}`);
            return next();
        }

        return runWithNow(parsed, next);
    };
}

async function main() {
    configureFixtureEnvironment();

    // Vite is created first and is the ONLY module loader used, so the harness and the app
    // share one instance of every module. `configFile` defaults to draft/vite.config.ts,
    // which carries the reactRouter() plugin that serves the routes.
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
    });

    const load = (path) => vite.ssrLoadModule(path);

    const [
        { useFakeSheetsCredentials },
        { setupServer },
        { FixtureSheetStore, fixtureHandlers },
        { runWithNow },
        { dataCache },
    ] = await Promise.all([
        load('/app/_shared/test/google-sheets-msw.ts'),
        import('msw/node'),
        load('/app/_shared/test/fixtures/fixture-msw-handlers.ts'),
        load('/app/_shared/lib/clock.server.ts'),
        load('/app/_shared/lib/cache/data-cache.service.ts'),
    ]);

    useFakeSheetsCredentials();

    const store = new FixtureSheetStore();
    const msw = setupServer(...fixtureHandlers(store));
    msw.listen({
        // Loud rather than fatal: an unhandled request here means the app reaches a network
        // the harness does not know about, which is itself a finding worth seeing -- but it
        // should not take the whole server down mid-browse.
        onUnhandledRequest: (request) => console.warn(`⚠️  unhandled request: ${request.method} ${request.url}`),
    });

    console.log('🏗️  rebuilding the season from fixtures…');
    const startedAt = Date.now();
    const { rebuildSeason } = await load('/harness/rebuild-season.ts');
    const summary = await rebuildSeason({});
    console.log(
        `✅ ${summary.documentsWritten} documents across ${summary.divisions.length} divisions ` +
            `in ${((Date.now() - startedAt) / 1000).toFixed(1)}s` +
            (summary.failures.length ? ` (${summary.failures.length} failed: ${summary.failures.join(', ')})` : ''),
    );

    // Built once and reused: the rebuild is clock-independent, so one set of documents
    // serves every date. See rebuild-determinism.test.ts.
    const app = express();
    app.use(vite.middlewares);
    app.use(timeTravel(runWithNow));

    // Firebase Functions parses the request body before the SSR handler ever runs, and that
    // is not a detail -- it *consumes the stream*, so `@react-router/express` then builds a
    // Request whose body is empty while its Content-Type still promises form data. Every
    // action bug this project has hit lives in that gap.
    //
    // Without these the harness had `req.body === undefined` on every request, so the
    // `getLoadContext: req => req.body` below passed undefined and no action behaved as it
    // does live. It replicated the shape of production and not the behaviour, which is worse
    // than not replicating it at all: it looked covered.
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.text());

    /**
     * Put the sheets back to their captured state.
     *
     * The store is one object for the life of the process, so a spec that writes leaves
     * its rows behind -- for the next test in the file, and (with `reuseExistingServer`)
     * for the next run altogether. A second run of a spec that approves a player would
     * then fail with "already in the game", which looks like a broken feature rather than
     * a dirty fixture. Reads need none of this, which is why it did not exist before.
     */
    app.post('/__harness/reset-sheets', (_req, res) => {
        store.reset();

        // The store alone is not the state. `readPlayers()` is cached for 24 hours, so a
        // released player stays in the app's idea of who is in the game long after the row
        // has gone from the sheet -- the reset would report success and change nothing
        // visible. Both have to go for "back to the captured state" to be true.
        dataCache.clear();

        res.json({ ok: true });
    });

    app.all(
        '*',
        createRequestHandler({
            build: () => vite.ssrLoadModule('virtual:react-router/server-build'),
            // Exactly as production does it -- this is how form actions receive their data
            // on Firebase, so getting it wrong would make actions behave differently here.
            getLoadContext: (req) => req.body,
            mode: 'development',
        }),
    );

    app.listen(PORT, () => {
        console.log(`\n🧪 fixture server  http://localhost:${PORT}`);
        console.log(`   time travel     http://localhost:${PORT}/?now=2025-01-10   (GW21, cup league stage)`);
        console.log(`   back to real    http://localhost:${PORT}/?now=clear\n`);
    });
}

main().catch((error) => {
    console.error('❌ fixture server failed to start:', error);
    process.exit(1);
});
