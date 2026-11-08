// @vitest-environment happy-dom

/* Location: app/_shared/components/gameweek-selector.test.tsx */

import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { GameWeekData } from '../lib/fpl/fpl-types';
import { GameweekSelector } from './gameweek-selector';

/**
 * The deadline line took `/admin/transfers` down with
 * `Cannot read properties of undefined (reading 'toLocaleDateString')`.
 *
 * `selectedGameweekData?.end.toLocaleDateString(...)` guards the object but not the field.
 * Two ways to reach it: a gameweek with no deadline, and — less obviously — a gameweek
 * whose `end` came straight out of Firestore as an ISO **string**, which has no such method
 * either. This is a shared component, so one break is a break on every page that shows it.
 */

const gameweek = (overrides: Partial<GameWeekData> = {}): GameWeekData =>
    ({
        fplEvent: { id: 21, name: 'Gameweek 21', deadline_time: '2025-01-14T18:00:00Z', finished: true },
        gameWeekIndex: 20,
        start: new Date('2025-01-04T11:00:00Z'),
        end: new Date('2025-01-14T18:00:00Z'),
        isCurrent: true,
        isNext: false,
        hasPassed: false,
        ...overrides,
    }) as unknown as GameWeekData;

function renderSelector(selected: GameWeekData) {
    const Stub = createRoutesStub([
        {
            path: '/',
            Component: () => (
                <GameweekSelector
                    currentGameweekData={gameweek()}
                    selectedGameweekData={selected}
                    availableGameweeks={[1, 2, 21]}
                />
            ),
        },
    ]);

    return render(<Stub initialEntries={['/']} />);
}

describe('with a real deadline', () => {
    it('shows the date', () => {
        renderSelector(gameweek());

        expect(screen.getByText('14/01/2025')).toBeDefined();
    });

    it('accepts an ISO string, as Firestore returns', () => {
        // The stored documents round-trip through JSON, so `end` is often a string.
        renderSelector(gameweek({ end: '2025-01-14T18:00:00Z' as unknown as Date }));

        expect(screen.getByText('14/01/2025')).toBeDefined();
    });
});

describe('when there is no usable deadline', () => {
    it('renders a dash rather than crashing on a missing end', () => {
        renderSelector(gameweek({ end: undefined as unknown as Date }));

        expect(screen.getByText('—')).toBeDefined();
    });

    it('renders a dash rather than crashing on an unparseable end', () => {
        renderSelector(gameweek({ end: 'not-a-date' as unknown as Date }));

        expect(screen.getByText('—')).toBeDefined();
    });

    it('still shows the rest of the selector', () => {
        renderSelector(gameweek({ end: undefined as unknown as Date }));

        expect(screen.getByText('Gameweek Deadline:')).toBeDefined();
    });
});

/**
 * "Combine gameweeks" lives inside the dropdown, opt-in per page: it is for the few divisions
 * that play for monthly prizes, so it must not add anything to a page that does not ask for it.
 */
type RangeProps = { showRangeOption?: boolean; selectedRange?: { from: number; to: number } | null };

/** Shows the URL the selector leaves us on, so assertions read what a user would see. */
function CurrentSearch() {
    return <output aria-label="search">{useLocation().search}</output>;
}

function renderWithRange(url: string, props: RangeProps) {
    const Stub = createRoutesStub([
        {
            path: '/',
            Component: () => (
                <>
                    <GameweekSelector
                        currentGameweekData={gameweek({ fplEvent: { id: 3 } as GameWeekData['fplEvent'] })}
                        selectedGameweekData={gameweek({ fplEvent: { id: 3 } as GameWeekData['fplEvent'] })}
                        availableGameweeks={[1, 2, 3]}
                        {...props}
                    />
                    <CurrentSearch />
                </>
            ),
        },
    ]);

    return render(<Stub initialEntries={[url]} />);
}

const openDropdown = () => fireEvent.click(screen.getByRole('button', { name: /▼/ }));

describe('combining gameweeks', () => {
    it('is not offered on a page that does not opt in', () => {
        renderWithRange('/', {});
        openDropdown();

        expect(screen.getByText('GW 2')).toBeDefined();
        expect(screen.queryByText(/Combine gameweeks/)).toBeNull();
    });

    it('is offered at the top of the gameweek list', () => {
        renderWithRange('/', { showRangeOption: true });
        openDropdown();

        expect(screen.getByRole('button', { name: /Combine gameweeks/ })).toBeDefined();
    });

    it('swaps the list for a from/to choice, and back', () => {
        renderWithRange('/', { showRangeOption: true });
        openDropdown();

        fireEvent.click(screen.getByRole('button', { name: /Combine gameweeks/ }));
        expect(screen.getByLabelText('From gameweek')).toBeDefined();
        expect(screen.queryByRole('button', { name: 'GW 2' })).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: /Back/ }));
        expect(screen.getByRole('button', { name: 'GW 2' })).toBeDefined();
    });

    it('shows the chosen range in place of the gameweek', () => {
        renderWithRange('/?gameweek=3', { showRangeOption: true });
        openDropdown();
        fireEvent.click(screen.getByRole('button', { name: /Combine gameweeks/ }));

        const show = screen.getByRole('button', { name: 'Show' }) as HTMLButtonElement;
        expect(show.disabled).toBe(true);

        fireEvent.change(screen.getByLabelText('From gameweek'), { target: { value: '2' } });
        fireEvent.change(screen.getByLabelText('To gameweek'), { target: { value: '3' } });
        fireEvent.click(show);

        expect(screen.getByLabelText('search').textContent).toBe('?from=2&to=3');
    });
});

describe('while a range is on screen', () => {
    it('labels the selector with the range', () => {
        renderWithRange('/?from=2&to=3', { showRangeOption: true, selectedRange: { from: 2, to: 3 } });

        expect(screen.getByText('2–3')).toBeDefined();
    });

    it('disables stepping a single gameweek', () => {
        renderWithRange('/?from=2&to=3', { showRangeOption: true, selectedRange: { from: 2, to: 3 } });

        expect((screen.getByTitle('Previous gameweek') as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByTitle('Next gameweek') as HTMLButtonElement).disabled).toBe(true);
    });

    it('leaves the range for a single gameweek picked from the list', () => {
        renderWithRange('/?from=2&to=3', { showRangeOption: true, selectedRange: { from: 2, to: 3 } });
        openDropdown();
        fireEvent.click(screen.getByRole('button', { name: /Back/ }));

        fireEvent.click(screen.getByRole('button', { name: 'GW 1' }));

        expect(screen.getByLabelText('search').textContent).toBe('?gameweek=1');
    });

    it('opens on the range, ready to adjust', () => {
        renderWithRange('/?from=2&to=3', { showRangeOption: true, selectedRange: { from: 2, to: 3 } });
        openDropdown();

        expect((screen.getByLabelText('From gameweek') as HTMLSelectElement).value).toBe('2');
        expect((screen.getByLabelText('To gameweek') as HTMLSelectElement).value).toBe('3');
    });
});
