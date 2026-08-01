/* Location: app/_shared/lib/loader-error.test.ts */

import { describe, expect, it } from 'vitest';
import { loaderErrorResponse, toErrorChain, toLoaderErrorPayload } from './loader-error';

/**
 * Built from a real failure: `yarn dev` against a misconfigured service account showed
 * "Failed to load dashboard data" and nothing else, while the server console held a
 * three-level chain ending in a 403. These assert that the chain now survives to the page.
 */

/** The exact shape `createAppError()` produces — a plain object, not an Error. */
const appError = (code: string, message: string, details?: unknown) => ({
    code,
    message,
    details,
    timestamp: new Date('2026-08-01T16:48:46.592Z'),
});

/** The real one, reproduced from the reported output. */
const sheetsPermissionDenied = () => {
    const transport = Object.assign(
        new Error(
            'Request failed with status 403: {"code":403,"message":"Method doesn\'t allow unregistered callers (callers without established identity). Please use API Key or other form of API consumer identity to call this API.","status":"PERMISSION_DENIED"}',
        ),
        { code: 403 },
    );

    return appError(
        'DIVISIONS_READ_ERROR',
        'Failed to read divisions from sheet',
        appError('SHEET_READ_ERROR', "Failed to read sheet range: 'Divisions'!A:E", transport),
    );
};

describe('unwrapping an error into a chain', () => {
    it('walks an AppError down to its root cause', () => {
        const chain = toErrorChain(sheetsPermissionDenied());

        expect(chain.map((link) => link.code)).toEqual(['DIVISIONS_READ_ERROR', 'SHEET_READ_ERROR', undefined]);
        expect(chain.at(-1)?.message).toContain('PERMISSION_DENIED');
    });

    it('handles a plain Error', () => {
        expect(toErrorChain(new Error('boom'))).toEqual([{ code: undefined, message: 'boom' }]);
    });

    it('follows an Error’s cause', () => {
        const chain = toErrorChain(new Error('outer', { cause: new Error('inner') }));

        expect(chain.map((link) => link.message)).toEqual(['outer', 'inner']);
    });

    it('handles a thrown string', () => {
        expect(toErrorChain('something broke')).toEqual([{ message: 'something broke' }]);
    });

    it('handles null and undefined without throwing', () => {
        expect(toErrorChain(null)).toEqual([]);
        expect(toErrorChain(undefined)).toEqual([]);
    });

    it('stops rather than looping on a self-referencing error', () => {
        // gaxios attaches `response.config` objects that point back at the error, so an
        // uncapped walk never returns.
        const circular: Record<string, unknown> = { code: 'A', message: 'a' };
        circular.details = circular;

        expect(toErrorChain(circular).length).toBeLessThanOrEqual(7);
    });
});

describe('the payload a page receives', () => {
    it('names what failed, in the caller’s words', () => {
        const payload = toLoaderErrorPayload('Could not load the dashboard', sheetsPermissionDenied());

        expect(payload.context).toBe('Could not load the dashboard');
    });

    it('surfaces the DEEPEST code, because that is the specific failure', () => {
        // DIVISIONS_READ_ERROR says which loader gave up; SHEET_READ_ERROR says why.
        const payload = toLoaderErrorPayload('Could not load the dashboard', sheetsPermissionDenied());

        expect(payload.code).toBe('SHEET_READ_ERROR');
    });

    it('keeps the whole chain so the 403 reaches the page', () => {
        const payload = toLoaderErrorPayload('Could not load the dashboard', sheetsPermissionDenied());

        expect(payload.chain).toHaveLength(3);
        expect(JSON.stringify(payload.chain)).toContain('PERMISSION_DENIED');
    });

    it('says so when an error carries no detail at all', () => {
        const payload = toLoaderErrorPayload('Could not load the dashboard', {});

        expect(payload.chain[0].message).toMatch(/No further detail/);
    });

    it('includes a stack outside production', () => {
        expect(toLoaderErrorPayload('x', sheetsPermissionDenied()).stack).toContain('Error');
    });

    it('withholds the stack in production, where it would leak server internals', () => {
        const previous = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        try {
            expect(toLoaderErrorPayload('x', sheetsPermissionDenied()).stack).toBeUndefined();
        } finally {
            process.env.NODE_ENV = previous;
        }
    });
});

describe('the thrown Response', () => {
    it('carries the payload as JSON, which React Router parses into useRouteError().data', async () => {
        const response = loaderErrorResponse('Could not load the dashboard', sheetsPermissionDenied());

        expect(response.status).toBe(500);
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect((await response.json()).code).toBe('SHEET_READ_ERROR');
    });

    it('accepts a different status for the errors that are not 500s', async () => {
        expect(loaderErrorResponse('Not found', new Error('nope'), 404).status).toBe(404);
    });
});
