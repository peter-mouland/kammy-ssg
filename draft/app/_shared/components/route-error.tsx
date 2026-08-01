/* Location: app/_shared/components/route-error.tsx */

import { isRouteErrorResponse } from 'react-router';
import { type LoaderErrorPayload, toLoaderErrorPayload } from '../lib/loader-error';
import styles from './route-error.module.css';

/**
 * What a reader sees when a page fails.
 *
 * The point of this component is that it is **specific**. "Something went wrong" tells
 * nobody anything, and the previous behaviour was worse than that: `createAppError()`
 * returns a plain object rather than an `Error`, so a thrown `AppError` matched neither
 * `isRouteErrorResponse` nor `instanceof Error` and every page fell through to "An
 * unexpected error occurred" — while the server console held the real 403.
 *
 * It renders the whole cause chain, outermost first, because the useful line is almost
 * always the deepest one. A stack appears only outside production.
 */

/** Recognises the payload `loaderErrorResponse()` puts in a thrown Response's body. */
function isLoaderErrorPayload(value: unknown): value is LoaderErrorPayload {
    return (
        typeof value === 'object' &&
        value !== null &&
        Array.isArray((value as LoaderErrorPayload).chain) &&
        typeof (value as LoaderErrorPayload).context === 'string'
    );
}

/**
 * A one-line nudge for the failures that have an obvious cause.
 *
 * Deliberately small: these three cover every "why is the whole site 500ing" this project
 * has actually hit, and a longer list would be guesswork.
 */
function hintFor(payload: LoaderErrorPayload): string | null {
    const text = payload.chain.map((link) => `${link.code ?? ''} ${link.message}`).join(' ');

    if (/PERMISSION_DENIED|unregistered callers|403/.test(text)) {
        return 'Google Sheets rejected the request as unauthenticated. Check GOOGLE_SERVICE_ACCOUNT_KEY is set in .env.local and that the service account email has Editor access to the spreadsheet.';
    }
    if (/Firebase service account not configured|MY_FIREBASE_SERVICE_ACCOUNT_KEY/.test(text)) {
        return 'Firestore has no credentials. Check MY_FIREBASE_SERVICE_ACCOUNT_KEY in .env.local.';
    }
    if (/GOOGLE_SHEETS_ID|MISSING_SPREADSHEET_ID/.test(text)) {
        return 'GOOGLE_SHEETS_ID is not set. Copy .env.example to .env.local and fill it in.';
    }
    return null;
}

/**
 * An expected state, explained. No code badge, no stack, no red.
 *
 * These are not faults — the season really has ended, or really has not started — and
 * dressing them as errors trains people to scroll past the page that does mean something
 * is broken.
 */
function FriendlyStateView({ payload }: { payload: LoaderErrorPayload }) {
    return (
        <div className={styles.routeError}>
            <h1 className={styles.heading}>{payload.context}</h1>
            {payload.chain.map((link, index) => (
                <p key={`${link.message}-${index}`} className={styles.explanation}>
                    {link.message}
                </p>
            ))}
        </div>
    );
}

function ErrorPayloadView({ payload }: { payload: LoaderErrorPayload }) {
    if (payload.friendly) return <FriendlyStateView payload={payload} />;

    const hint = hintFor(payload);

    return (
        <div className={styles.routeError}>
            <h1 className={styles.heading}>{payload.context}</h1>
            {payload.code ? <div className={styles.code}>{payload.code}</div> : null}

            {hint ? <p className={styles.hint}>{hint}</p> : null}

            <ol className={styles.chain}>
                {payload.chain.map((link, index) => (
                    <li
                        // The chain is a fixed snapshot, so the index is stable.
                        key={`${link.code ?? 'link'}-${index}`}
                        className={`${styles.link} ${index === payload.chain.length - 1 ? styles.cause : ''}`}
                    >
                        {link.code ? <span className={styles.linkCode}>{link.code}</span> : null}
                        {link.message}
                    </li>
                ))}
            </ol>

            {payload.stack ? (
                <details className={styles.details}>
                    <summary className={styles.summary}>Stack trace</summary>
                    <pre className={styles.stack}>{payload.stack}</pre>
                </details>
            ) : null}
        </div>
    );
}

/**
 * Renders any route error: a structured payload, a bare `Response`, a real `Error`, an
 * `AppError` plain object, or something unrecognisable.
 */
export function RouteError({ error }: { error: unknown }) {
    if (isRouteErrorResponse(error)) {
        // A 404 or a deliberate 400 carries a sentence, not a payload; both are fine.
        if (isLoaderErrorPayload(error.data)) {
            return <ErrorPayloadView payload={error.data} />;
        }

        return (
            <ErrorPayloadView
                payload={{
                    context: `${error.status} ${error.statusText}`,
                    chain: [{ message: typeof error.data === 'string' ? error.data : 'No further detail.' }],
                }}
            />
        );
    }

    // Anything thrown outside a loader, including a render-time crash.
    return <ErrorPayloadView payload={toLoaderErrorPayload('Something went wrong on this page', error)} />;
}
