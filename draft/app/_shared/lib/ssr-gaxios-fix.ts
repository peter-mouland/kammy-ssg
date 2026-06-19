// Vite SSR polyfills `window`, which makes gaxios bind to `window.fetch` at import time.
// That breaks Google OAuth in dev. Remove the shim before any google/gaxios modules load.
if (import.meta.env.SSR && 'window' in globalThis) {
    // @ts-expect-error intentional SSR workaround
    delete globalThis.window;
}
