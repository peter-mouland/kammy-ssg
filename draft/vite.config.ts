import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [reactRouter()],
    css: {
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
        rollupOptions: {
            external: [
                // Additional external packages for client build
                "googleapis",
                "google-auth-library"
            ]
        }
    }
});
