/* Location: app/_shared/lib/form-data.ts */

import type { ActionFunctionArgs } from 'react-router';

/**
 * Reading form fields the same way on Firebase and on React Router's own server.
 *
 * Firebase Functions parses the request body before the SSR handler ever sees it, so by the
 * time `@react-router/express` rebuilds a `Request` the stream is already spent and
 * `request.formData()` comes back empty. `functions/src/ssr.ts` works around that by passing
 * the parsed body through as the load context, so the value is in one place or the other
 * depending on where the app is running -- this reads whichever one has it.
 *
 * **`context` is not guaranteed to be an object.** It is `req.body`, and a request Firebase
 * did not parse (an unrecognised content type, or an empty body) leaves it `undefined`.
 * Indexing it directly threw `Cannot read properties of undefined` *before* the caller's
 * try/catch could run, which surfaced as a bare "Unexpected Server Error" page with the real
 * cause nowhere -- so the optional chaining below is load-bearing, not defensive habit.
 */

export interface ActionFormData {
    /** The field's value, or `undefined` when neither source carries it. */
    get(name: string): string | undefined;
}

/** Only the two fields this reads — every caller passes exactly these. */
type FormDataSource = Pick<ActionFunctionArgs, 'request' | 'context'>;

export async function requestFormData({ request, context }: FormDataSource): Promise<ActionFormData> {
    // Spent on Firebase, populated everywhere else. Either way it must not throw: losing the
    // body is recoverable via the context, losing the whole action is not.
    let formData: FormData | null = null;
    try {
        formData = await request.formData();
    } catch (error) {
        console.warn('requestFormData: request.formData() failed, falling back to load context', error);
    }

    const fromContext = context as Record<string, unknown> | undefined;

    return {
        get: (name) => {
            const contextValue = fromContext?.[name]; // needed for firebase
            if (contextValue != null) {
                return String(contextValue);
            }

            const formValue = formData?.get(name); // needed for react-router-v7
            return typeof formValue === 'string' ? formValue : undefined;
        },
    };
}
