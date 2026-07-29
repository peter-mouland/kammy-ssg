import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [reactRouter()],
        css: {
            devSourcemap: true,
            modules: {
                // CSS modules are enabled by default for .module.css files
                localsConvention: 'camelCase'
            }
        },
        ssr: {
            noExternal: [],
            // Kept out of the SERVER bundle and required at runtime instead. Scoped
            // @googleapis/sheets, not the googleapis umbrella -- see the note in
            // _shared/lib/sheets/utils/common.ts.
            //
            // Anything named here MUST also be a dependency of functions/package.json,
            // because that is what Firebase installs for the deployed function. Nothing
            // checks that pairing, so a mismatch builds green and fails on first request.
            external: [
                "@googleapis/sheets"
            ]
        },
        build: {
            // Use environment variable to control source maps
            sourcemap: env.VITE_ENABLE_SOURCEMAPS === 'true' ? true :
                env.VITE_ENABLE_SOURCEMAPS === 'hidden' ? 'hidden' :
                    false,

            // NOTE: deliberately no `rollupOptions.external` here.
            //
            // This is the CLIENT build, where `external` does not mean "keep it off the
            // browser" -- it means "emit the bare specifier and trust something to resolve
            // it". A browser cannot resolve `@googleapis/sheets`, so listing server-only
            // packages here turns a loud build failure into a bundle that only breaks in a
            // user's browser.
            //
            // Server-only code is kept out of the client by never being reachable from it:
            // React Router strips `loader`/`action` and their exclusive imports, and the
            // index.ts / index.server.ts split (P2.7) stops a component importing anything
            // that touches Firebase, Sheets or process.env. If that ever fails, we want
            // Vite to error on the Node built-ins rather than paper over it here.
            //
            // Verified: removing this list changed nothing -- the client output contains no
            // trace of @googleapis/sheets, google-auth-library or GOOGLE_SERVICE_ACCOUNT_KEY.
        }
    };
});
