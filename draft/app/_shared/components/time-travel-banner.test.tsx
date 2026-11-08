// @vitest-environment happy-dom

/* Location: app/_shared/components/time-travel-banner.test.tsx */

import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { TimeTravelBanner } from './time-travel-banner';

/**
 * "Back to Current" is the one-tap way home from a past gameweek on /leagues, /teams and
 * /transfers. It called a `setSearchParams` that was never taken from the hook, so every
 * click threw a ReferenceError and the button did nothing.
 */

/** Shows the URL the banner leaves us on, so assertions read what a user would see. */
function CurrentSearch() {
    return <output aria-label="search">{useLocation().search}</output>;
}

function renderBanner(url: string) {
    const Stub = createRoutesStub([
        {
            path: '/',
            Component: () => (
                <>
                    <TimeTravelBanner currentGameweek={21} />
                    <CurrentSearch />
                </>
            ),
        },
    ]);

    return render(<Stub initialEntries={[url]} />);
}

describe('viewing a past gameweek', () => {
    it('says which gameweek is on screen', () => {
        renderBanner('/?gameweek=5');

        expect(screen.getByText(/Viewing Gameweek 5/)).toBeDefined();
    });

    it('goes back to the current gameweek', () => {
        renderBanner('/?gameweek=5');

        fireEvent.click(screen.getByRole('button', { name: 'Back to Current' }));

        expect(screen.getByLabelText('search').textContent).toBe('?gameweek=21');
    });
});
