/* Location: app/_shared/lib/loader-error.ts */

/**
 * Turning a caught loader error into something a page can actually show.
 *
 * Every route used to do `throw new Response('Failed to load X', { status: 500 })`, which
 * discards the one thing worth knowing. A reader got "Failed to load dashboard data" while
 * the server console held `SHEET_READ_ERROR -> 403 PERMISSION_DENIED -> the service account
 * is not authorised`. The cause was three levels down and never left the terminal.
 *
 * Two shapes have to be unwrapped, because the codebase throws both:
 *
 *   - `AppError`, from `createAppError()` — a **plain object**, not an Error. That is why
 *     the root boundary's `error instanceof Error` branch never matched and everything fell
 *     through to "An unexpected error occurred".
 *   - real `Error`s, whose `cause` may chain.
 *
 * Both nest: an `AppError`'s `details` is usually the error beneath it.
 */

export interface ErrorLink {
    code?: string;
    message: string;
}

export interface LoaderErrorPayload {
    /** What the page was trying to do, e.g. 'Failed to load the dashboard'. */
    context: string;
    /** The most specific code found anywhere in the chain — the useful one. */
    code?: string;
    /** Outermost first. The last entry is normally the real cause. */
    chain: ErrorLink[];
    /** Development only; never sent to a browser in production. */
    stack?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** `AppError` is structural, not a class — this is the only way to recognise one. */
const isAppError = (value: unknown): value is { code: string; message: string; details?: unknown } =>
    isRecord(value) && typeof value.code === 'string' && typeof value.message === 'string';

/**
 * Flatten an error and everything beneath it into outermost-first links.
 *
 * Depth-capped because `details` can hold a gaxios error whose `response.config` points
 * back at objects containing the error again; without a cap a 403 from Sheets walks in
 * circles.
 */
export function toErrorChain(error: unknown, depth = 0): ErrorLink[] {
    if (depth > 5 || error === undefined || error === null) return [];

    if (isAppError(error)) {
        return [{ code: error.code, message: error.message }, ...toErrorChain(error.details, depth + 1)];
    }

    if (error instanceof Error) {
        const code = isRecord(error) && typeof error.code === 'string' ? error.code : undefined;
        return [{ code, message: error.message }, ...toErrorChain(error.cause, depth + 1)];
    }

    if (typeof error === 'string') return [{ message: error }];

    return [];
}

function firstStack(error: unknown, depth = 0): string | undefined {
    if (depth > 5 || !isRecord(error)) return undefined;
    if (error instanceof Error && error.stack) return error.stack;
    return firstStack(error.details, depth + 1) ?? firstStack(error.cause, depth + 1);
}

/**
 * Build the payload a route error boundary renders.
 *
 * `code` is taken from the **deepest** link that has one, because that is the specific
 * failure rather than the generic wrapper: `DIVISIONS_READ_ERROR` tells you which loader
 * gave up, `SHEET_READ_ERROR` tells you why.
 */
export function toLoaderErrorPayload(context: string, error: unknown): LoaderErrorPayload {
    const chain = toErrorChain(error);
    const coded = chain.filter((link) => link.code);

    return {
        context,
        code: coded.at(-1)?.code,
        chain: chain.length > 0 ? chain : [{ message: 'No further detail was attached to this error.' }],
        // A stack is a server-side artefact. Useful locally, noise-or-worse in a browser.
        stack: process.env.NODE_ENV === 'production' ? undefined : firstStack(error),
    };
}

/**
 * The replacement for `throw new Response('Failed to load X', { status: 500 })`.
 *
 * React Router parses a JSON body into `useRouteError().data`, so the boundary receives the
 * structured payload rather than a sentence.
 */
export function loaderErrorResponse(context: string, error: unknown, status = 500): Response {
    console.error(`${context}:`, error);

    return new Response(JSON.stringify(toLoaderErrorPayload(context, error)), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
