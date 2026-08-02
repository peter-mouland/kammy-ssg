/* Location: app/_shared/lib/form-data.test.ts */

/**
 * These cover the shapes the load context actually arrives in.
 *
 * `getLoadContext: (req) => req.body` (`functions/src/ssr.ts`) means the context is whatever
 * Firebase's body parser produced -- an object for a content type it recognises, and
 * `undefined` for one it does not. The undefined case used to throw *before* the calling
 * action's try/catch, which is how a populate failure reached the browser as a bare
 * "Unexpected Server Error" with the real cause nowhere.
 */

import { describe, expect, it } from 'vitest';
import { requestFormData } from './form-data';

const formRequest = (fields: Record<string, string>) =>
    new Request('http://localhost/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(fields).toString(),
    });

// Only `request` and `context` are read; the rest of ActionFunctionArgs is never touched.
const call = (request: Request, context: unknown) =>
    requestFormData({ request, context } as unknown as Parameters<typeof requestFormData>[0]);

describe('requestFormData', () => {
    it('reads a field from the request body when there is no load context', async () => {
        const formData = await call(formRequest({ actionType: 'populateBootstrapData' }), undefined);

        expect(formData.get('actionType')).toBe('populateBootstrapData');
    });

    it('does not throw when the load context is undefined', async () => {
        // The regression. Firebase leaves `req.body` undefined for a body it did not parse,
        // and indexing it took the whole action down before it could report anything.
        const formData = await call(formRequest({}), undefined);

        expect(() => formData.get('actionType')).not.toThrow();
        expect(formData.get('actionType')).toBeUndefined();
    });

    it('prefers the load context, which is where Firebase leaves the parsed body', async () => {
        // The request stream is already spent on Firebase, so the context is the only source.
        const formData = await call(formRequest({}), { actionType: 'processGameweek' });

        expect(formData.get('actionType')).toBe('processGameweek');
    });

    it('falls back to the request when the context has no such field', async () => {
        const formData = await call(formRequest({ divisionId: 'greatScott' }), { actionType: 'processDraft' });

        expect(formData.get('actionType')).toBe('processDraft');
        expect(formData.get('divisionId')).toBe('greatScott');
    });

    it('returns undefined for a field neither source carries', async () => {
        const formData = await call(formRequest({ actionType: 'processDraft' }), {});

        expect(formData.get('gameweek')).toBeUndefined();
    });

    it('coerces a non-string context value, since a parsed body is not all strings', async () => {
        const formData = await call(formRequest({}), { gameweek: 21 });

        expect(formData.get('gameweek')).toBe('21');
    });

    it('survives a request whose body cannot be read as form data', async () => {
        // Reading it twice is the cheapest way to produce a spent stream, which is the state
        // Firebase hands over.
        const request = formRequest({ actionType: 'systemHealthCheck' });
        await request.formData();

        const formData = await call(request, { actionType: 'systemHealthCheck' });

        expect(formData.get('actionType')).toBe('systemHealthCheck');
    });
});
