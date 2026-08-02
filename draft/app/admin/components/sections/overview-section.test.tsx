// @vitest-environment happy-dom

/* Location: app/admin/components/sections/overview-section.test.tsx */

/**
 * The overview is the first page an admin opens, including when nothing is set up.
 *
 * It used to be handed a fabricated `{ fplEvent: { id: 1 } }` whenever the status services
 * failed, so it cheerfully reported "GW 1 needs processing" for a league with no gameweeks,
 * no calendar and no players. That is worse than a crash: it sends someone looking for a
 * processing problem instead of an empty database.
 */

import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { GameWeekData } from '../../../_shared/lib/fpl/fpl-types';
import type { SystemStatusSummary } from '../../types/admin-types';
import { OverviewSection } from './overview-section';

const gameweek = (id: number): GameWeekData =>
    ({ fplEvent: { id, name: `Gameweek ${id}` }, start: new Date(), end: new Date() }) as unknown as GameWeekData;

const systemStatus = (currentGameweek: GameWeekData | undefined, lastProcessedGameweek = 0): SystemStatusSummary =>
    ({
        currentGameweek,
        bootstrapLastUpdated: null,
        systemHealth: {
            fplCache: { status: 'healthy' },
            firebase: { status: 'healthy', message: '' },
            googleSheets: { status: 'healthy', message: '' },
            overall: { status: 'healthy', message: 'All systems operational' },
        },
        transfers: { pending: 0, approved: 0, rejected: 0, total: 0, byDivision: {} },
        draft: { stage: 'complete', isComplete: true },
        gameweekProcessing: { currentGameweek, lastProcessedGameweek },
        recommendations: [],
    }) as unknown as SystemStatusSummary;

const renderOverview = (status: SystemStatusSummary) => {
    const Stub = createRoutesStub([
        {
            path: '/admin',
            Component: () => (
                <OverviewSection
                    systemStatus={status}
                    sharedContext={{} as never}
                    expandedSections={new Set()}
                    toggleSection={() => undefined}
                />
            ),
        },
    ]);
    return render(<Stub initialEntries={['/admin']} />);
};

describe('OverviewSection', () => {
    it('reports the gameweek as processed when it matches the last processed one', () => {
        renderOverview(systemStatus(gameweek(21), 21));

        expect(screen.getByText('GW 21 processed')).toBeDefined();
    });

    it('reports the gameweek as needing processing when it does not', () => {
        renderOverview(systemStatus(gameweek(21), 20));

        expect(screen.getByText('GW 21 needs processing')).toBeDefined();
    });

    it('says there is no current gameweek rather than inventing gameweek 1', () => {
        // The regression. An empty database produced "GW 1 needs processing".
        renderOverview(systemStatus(undefined));

        expect(screen.getByText('No current gameweek')).toBeDefined();
        expect(screen.queryByText(/GW 1/)).toBeNull();
    });

    it('does not offer to copy player stats when there is no gameweek to copy them for', () => {
        renderOverview(systemStatus(undefined));

        expect(screen.queryByRole('button', { name: /copy/i })).toBeNull();
    });
});
