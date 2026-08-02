// @vitest-environment happy-dom

/* Location: app/admin/components/sections/gameweek-processing-section.test.tsx */

/**
 * This section is where an admin lands when there is no data, so it has to survive there.
 *
 * Two live states produce no current gameweek: an empty database, and a pre-season FPL
 * calendar where no event carries `is_current`. Reading `.fplEvent.id` straight off the
 * missing gameweek took the page down and hid "Populate Bootstrap Data" -- the one control
 * that resolves the state it was crashing in.
 */

import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { GameWeekData } from '../../../_shared/lib/fpl/fpl-types';
import type { AdminDataContext } from '../../types/admin-orchestrator-types';
import type { SystemStatusSummary } from '../../types/admin-types';
import { GameweekProcessingSection } from './gameweek-processing-section';

const gameweek = (id: number, deadline: string): GameWeekData =>
    ({
        fplEvent: { id, deadline_time: deadline, name: `Gameweek ${id}`, finished: false },
        start: new Date(deadline),
        end: new Date(deadline),
    }) as unknown as GameWeekData;

/** Everything the section needs in order to render at all. */
const systemStatus = (currentGameweek: GameWeekData | undefined): SystemStatusSummary =>
    ({
        currentGameweek,
        bootstrapLastUpdated: null,
        transfers: { pending: 0, approved: 0, rejected: 0, total: 0, byDivision: {} },
        gameweekProcessing: {
            currentGameweek,
            lastProcessedGameweek: 0,
            totalGameweeks: 38,
            processedGameweeks: [],
            pendingGameweeks: [],
            isUpToDate: false,
            needsProcessing: true,
            completionPercentage: 0,
            lastProcessedAt: null,
        },
    }) as unknown as SystemStatusSummary;

const sharedContext = (events: GameWeekData[]): AdminDataContext =>
    ({ fplData: { events } }) as unknown as AdminDataContext;

const renderSection = (status: SystemStatusSummary, context: AdminDataContext) => {
    // useFetcher needs a router around it; the section never navigates.
    const Stub = createRoutesStub([
        {
            path: '/admin/points',
            Component: () => <GameweekProcessingSection systemStatus={status} sharedContext={context} />,
        },
    ]);
    return render(<Stub initialEntries={['/admin/points']} />);
};

describe('GameweekProcessingSection', () => {
    it('renders the gameweek when there is a current one', () => {
        renderSection(systemStatus(gameweek(21, '2025-01-14T18:00:00Z')), sharedContext([]));

        expect(screen.getByText('Gameweek 21')).toBeDefined();
    });

    it('renders, rather than crashing, when no gameweek is current', () => {
        // Pre-season: a published calendar, but nothing has started.
        const events = [gameweek(1, '2099-08-15T17:30:00Z'), gameweek(2, '2099-08-22T17:30:00Z')];

        renderSection(systemStatus(undefined), sharedContext(events));

        expect(screen.getByText('The season has not started yet')).toBeDefined();
        expect(screen.getByText('None')).toBeDefined();
    });

    it('keeps Populate Bootstrap Data reachable when there is no gameweek at all', () => {
        // An empty database -- no calendar, no current gameweek. Populating is the fix, so
        // the button must survive the state it fixes.
        renderSection(systemStatus(undefined), sharedContext([]));

        expect(screen.getByText('The gameweek calendar has not been loaded yet')).toBeDefined();
        expect(screen.getByRole('button', { name: /Populate Bootstrap Data/ })).toBeDefined();
    });

    it('does not offer to run a gameweek that does not exist', () => {
        renderSection(systemStatus(undefined), sharedContext([]));

        // The accessible name carries the button's ▶️ icon alongside its label.
        const runButton = screen.getByRole('button', { name: /Run Gameweek/ });
        expect(runButton.hasAttribute('disabled')).toBe(true);
        expect(screen.queryByText(/Run Gameweek 0/)).toBeNull();
    });

    it('survives a shared context that carries no fpl data', () => {
        // The admin loader returns nulls for its heavy fields on the lightweight paths.
        renderSection(systemStatus(undefined), {} as AdminDataContext);

        expect(screen.getByText('The gameweek calendar has not been loaded yet')).toBeDefined();
    });
});
