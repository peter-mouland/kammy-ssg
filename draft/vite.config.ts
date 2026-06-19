import { reactRouter } from "@react-router/dev/vite";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";

/** gaxios picks window.fetch at import time; Vite SSR polyfills window and breaks Google OAuth. */
function ssrGaxiosFix(): Plugin {
    const stripWindow = () => {
        if ("window" in globalThis) {
            // @ts-expect-error intentional SSR workaround
            delete globalThis.window;
        }
    };

    return {
        name: "ssr-gaxios-fix",
        configureServer(server) {
            stripWindow();
            server.middlewares.use((_req, _res, next) => {
                stripWindow();
                next();
            });
        },
    };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [ssrGaxiosFix(), reactRouter()],
        css: {
            devSourcemap: true,
            modules: {
                // CSS modules are enabled by default for .module.css files
                localsConvention: 'camelCase'
            }
        },
        ssr: {
            noExternal: [],
            external: [
                // Ensure Google APIs are not bundled for client
                "googleapis",
                "google-auth-library"
            ]
        },
        build: {
            // Use environment variable to control source maps
            sourcemap: env.VITE_ENABLE_SOURCEMAPS === 'true' ? true :
                env.VITE_ENABLE_SOURCEMAPS === 'hidden' ? 'hidden' :
                    false,

            rollupOptions: {
                external: [
                    // Additional external packages for client build
                    "googleapis",
                    "google-auth-library"
                ]
            }
        }
    };
});
