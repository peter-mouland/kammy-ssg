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
