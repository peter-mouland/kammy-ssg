// @vitest-environment happy-dom

/* Location: app/_shared/components/route-error.test.tsx */

import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';
import { toLoaderErrorPayload } from '../lib/loader-error';
import { RouteError } from './route-error';

/**
 * What a reader actually sees when a page fails.
 *
 * The regression this guards: `createAppError()` returns a plain object rather than an
 * `Error`, so a thrown `AppError` matched neither `isRouteErrorResponse` nor
 * `instanceof Error`, and every page rendered "An unexpected error occurred" while the
 * real 403 sat in the server console.
 */

const sheetsPermissionDenied = {
    code: 'DIVISIONS_READ_ERROR',
    message: 'Failed to read divisions from sheet',
    details: {
        code: 'SHEET_READ_ERROR',
        message: "Failed to read sheet range: 'Divisions'!A:E",
        details: new Error('Request failed with status 403: PERMISSION_DENIED, unregistered callers'),
    },
};

/**
 * Several assertions use `getAllByText`: outside production the stack trace is rendered
 * too, so a message legitimately appears both in the cause chain and in the trace.
 */
const shown = (text: string | RegExp) => screen.getAllByText(text).length;

/** `RouteError` is rendered by a route boundary, so it needs a router in context. */
function renderError(error: unknown) {
    const Stub = createRoutesStub([{ path: '/', Component: () => <RouteError error={error} /> }]);
    return render(<Stub initialEntries={['/']} />);
}

describe('a loader failure', () => {
    const thrown = {
        status: 500,
        statusText: 'Internal Server Error',
        data: toLoaderErrorPayload('Could not load the dashboard', sheetsPermissionDenied),
        internal: false,
    };

    it('says which page failed, in plain words', () => {
        renderError(thrown);

        expect(screen.getByText('Could not load the dashboard')).toBeDefined();
    });

    it('shows the specific error code, not a generic 500', () => {
        renderError(thrown);

        expect(shown('SHEET_READ_ERROR')).toBeGreaterThan(0);
    });

    it('shows the whole cause chain, down to the real reason', () => {
        renderError(thrown);

        expect(shown(/Failed to read divisions from sheet/)).toBeGreaterThan(0);
        expect(shown(/PERMISSION_DENIED/)).toBeGreaterThan(0);
    });

    it('tells the reader what to do about a 403 from Sheets', () => {
        renderError(thrown);

        expect(shown(/GOOGLE_SERVICE_ACCOUNT_KEY/)).toBeGreaterThan(0);
    });
});

describe('a thrown AppError that never reached a Response', () => {
    it('is rendered specifically rather than as “unexpected”', () => {
        // This is the case that used to fall through every branch of the old boundary.
        renderError(sheetsPermissionDenied);

        expect(shown(/Failed to read divisions from sheet/)).toBeGreaterThan(0);
        expect(screen.queryByText(/An unexpected error occurred/)).toBeNull();
    });
});

describe('an expected state rather than a fault', () => {
    const seasonEnded = {
        status: 503,
        statusText: 'Service Unavailable',
        data: {
            context: 'The season has ended',
            chain: [{ message: 'The final gameweek is over, so there is no live gameweek to show.' }],
            friendly: true,
        },
        internal: false,
    };

    it('leads with the explanation', () => {
        renderError(seasonEnded);

        expect(screen.getByText('The season has ended')).toBeDefined();
        expect(screen.getByText(/final gameweek is over/)).toBeDefined();
    });

    it('shows no stack trace — this is not a bug and should not look like one', () => {
        renderError(seasonEnded);

        expect(screen.queryByText('Stack trace')).toBeNull();
    });

    it('shows no error code', () => {
        renderError({ ...seasonEnded, data: { ...seasonEnded.data, code: 'SOME_CODE' } });

        expect(screen.queryByText('SOME_CODE')).toBeNull();
    });
});

describe('other things a boundary can catch', () => {
    it('renders a plain Error’s message', () => {
        renderError(new Error('Firebase service account not configured'));

        expect(shown(/Firebase service account not configured/)).toBeGreaterThan(0);
    });

    it('offers the env-var hint for a missing Firebase credential', () => {
        renderError(new Error('Firebase service account not configured'));

        expect(shown(/MY_FIREBASE_SERVICE_ACCOUNT_KEY/)).toBeGreaterThan(0);
    });

    it('renders a deliberate 404 as its own message, not as a crash', () => {
        renderError({ status: 404, statusText: 'Not Found', data: 'Player not found', internal: false });

        expect(screen.getByText('404 Not Found')).toBeDefined();
        expect(screen.getByText('Player not found')).toBeDefined();
    });

    it('still says something when handed something meaningless', () => {
        renderError(undefined);

        expect(screen.getByText(/No further detail/)).toBeDefined();
    });
});
