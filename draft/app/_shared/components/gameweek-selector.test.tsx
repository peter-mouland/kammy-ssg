// @vitest-environment happy-dom

/* Location: app/_shared/components/gameweek-selector.test.tsx */

import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
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
