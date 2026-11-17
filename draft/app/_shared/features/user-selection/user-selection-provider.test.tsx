// @vitest-environment happy-dom

/* Location: app/_shared/features/user-selection/user-selection-provider.test.tsx */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRoutesStub, type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import type { UserTeamsSheetData } from '../../types/league-types';
import { clearUserSelection, getUserSelection } from './user-selection.utils';
import { UserSelectionProvider } from './user-selection-provider';

/**
 * A first-time visitor picks their name from "Who are you?". That choice was saved to the
 * cookie and the address bar, but the page's loader never ran again -- so `/teams` stayed
 * on "unknown user", and `/leagues` and `/transfers` reopened the modal immediately because
 * their loader data still said a selection was required.
 *
 * The loader here uses the real `getUserSelection`, as the page loaders do, so the test
 * only passes if picking a name actually reaches the server side.
 */

const users: UserTeamsSheetData[] = [
    { userId: 'andy', userName: 'Andy', teamName: 'Andy FC', divisionId: 'premierLeague', lastUpdated: new Date(0) },
    { userId: 'chris', userName: 'Chris', teamName: 'Chris FC', divisionId: 'championship', lastUpdated: new Date(0) },
];

const loader = ({ request }: LoaderFunctionArgs) => ({ persistedUser: getUserSelection(request) });

function Page() {
    const data = useLoaderData<typeof loader>();
    return (
        <UserSelectionProvider users={users} initialSelection={data.persistedUser}>
            <p>Signed in as {data.persistedUser.selectedUserId ?? 'nobody'}</p>
        </UserSelectionProvider>
    );
}

function renderPage() {
    const Stub = createRoutesStub([{ path: '/leagues', Component: Page, loader }]);
    return render(<Stub initialEntries={['/leagues']} />);
}

afterEach(() => {
    clearUserSelection();
});

describe('a first-time visitor picking their name', () => {
    it('is asked who they are', async () => {
        renderPage();

        expect(await screen.findByText('Who are you?')).toBeDefined();
        expect(screen.getByText('Signed in as nobody')).toBeDefined();
    });

    it('loads the page as the manager they picked, and the modal stays closed', async () => {
        renderPage();
        fireEvent.click(await screen.findByRole('button', { name: /Andy/ }));

        expect(await screen.findByText('Signed in as andy')).toBeDefined();
        await waitFor(() => expect(screen.queryByText('Who are you?')).toBeNull());
    });

    it('remembers the choice for the next visit', async () => {
        renderPage();
        fireEvent.click(await screen.findByRole('button', { name: /Chris/ }));

        await waitFor(() => expect(document.cookie).toContain('__session=chris'));
    });
});
