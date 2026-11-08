// @vitest-environment happy-dom

/* Location: app/transfers/components/player-out-selector.test.tsx */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { RosterPlayer, TeamRoster } from '../../_shared/types/squad-types';
import type { CategoryStanding } from '../../leagues';
import { PlayerOutSelector } from './player-out-selector';

/**
 * The "select player from your team" step, as a manager sees it: their squad grouped the
 * way the league table scores it, each group headed by where they stand in that category.
 */

const teamsByCode = { 3: { code: 3, name: 'Arsenal', short_name: 'ARS' } } as unknown as Record<number, FplTeam>;

const player = (code: number, webName: string, position: string): EnhancedPlayerData =>
    ({
        id: code,
        code,
        web_name: webName,
        team_code: 3,
        first_name: '',
        second_name: webName,
        draft: { position, pointsTotal: 10, pointsBreakdown: {} },
    }) as unknown as EnhancedPlayerData;

const PLAYERS = [
    player(1, 'Raya', 'gk'),
    player(2, 'Saliba', 'cb'),
    player(3, 'Gabriel', 'cb'),
    player(4, 'Havertz', 'ca'),
    player(5, 'Neto', 'gk'),
    player(6, 'Loaned', 'mid'),
];
const playersByCode = Object.fromEntries(PLAYERS.map((p) => [p.code, p]));

const slot = (p: EnhancedPlayerData) => ({
    player: { playerCode: p.code, playerName: p.web_name, playerPosition: p.draft.position } as RosterPlayer,
});

// Stored in a scrambled order on purpose: the page must not depend on it.
const roster = {
    ca_0: slot(PLAYERS[3]),
    on_loan_0: slot(PLAYERS[5]),
    cb_1: slot(PLAYERS[2]),
    sub_0: slot(PLAYERS[4]),
    gk_0: slot(PLAYERS[0]),
    cb_0: slot(PLAYERS[1]),
} as unknown as TeamRoster;

const CB_STANDING: CategoryStanding = {
    position: 'cb',
    label: 'CB',
    slots: ['cb_0', 'cb_1'],
    rank: 3,
    isTied: false,
    rankPoints: 5,
    points: 142,
    totalManagers: 8,
    gapAbove: 10,
    gapBelow: 25,
};

function renderSelector({
    categoryStandings = [CB_STANDING],
    onPlayerChange = vi.fn(),
}: {
    categoryStandings?: CategoryStanding[];
    onPlayerChange?: (p: RosterPlayer | null) => void;
} = {}) {
    const Stub = createRoutesStub([
        {
            path: '/',
            Component: () => (
                <PlayerOutSelector
                    roster={roster}
                    selectedPlayer={null}
                    onPlayerChange={onPlayerChange}
                    transferType="TRANSFER"
                    playersByCode={playersByCode}
                    teamsByCode={teamsByCode}
                    categoryStandings={categoryStandings}
                    embeddedInJourney
                />
            ),
        },
    ]);
    return render(<Stub initialEntries={['/']} />);
}

const groupNames = () => screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'));

describe('the squad, grouped by scoring category', () => {
    it('shows categories in league-table order, whatever order the roster is stored in, with loans last', async () => {
        renderSelector();
        await screen.findByRole('region', { name: 'CB' });

        expect(groupNames()).toEqual(['GK / Sub', 'CB', 'CA', 'On loan']);
    });

    it('puts each player in their category, keeper before sub', async () => {
        renderSelector();
        const gk = await screen.findByRole('region', { name: 'GK / Sub' });
        const cb = screen.getByRole('region', { name: 'CB' });

        expect(gk.textContent).toMatch(/Raya.*Neto/);
        expect(within(cb).getByText(/Saliba/)).toBeDefined();
        expect(within(cb).getByText(/Gabriel/)).toBeDefined();
    });
});

describe('the category standing', () => {
    it('says where the manager sits and how close the managers either side are', async () => {
        renderSelector();
        const cb = await screen.findByRole('region', { name: 'CB' });

        expect(within(cb).getByText('3rd')).toBeDefined();
        expect(within(cb).getByText('142 pts')).toBeDefined();
        expect(within(cb).getByText('10 behind 2nd · 25 clear of 4th')).toBeDefined();
    });

    it('leaves out rank points, which the place already implies', async () => {
        renderSelector();
        const cb = await screen.findByRole('region', { name: 'CB' });

        expect(within(cb).queryByText(/rank pts/)).toBeNull();
        expect(within(cb).getByText('10 behind 2nd · 25 clear of 4th')).toBeDefined();
    });

    it('leaves the squad choosable when no standings could be loaded', async () => {
        renderSelector({ categoryStandings: [] });
        const cb = await screen.findByRole('region', { name: 'CB' });

        expect(within(cb).queryByText('3rd')).toBeNull();
        expect(within(cb).getByText(/Saliba/)).toBeDefined();
    });
});

describe('choosing a player', () => {
    it('selects the player whose row was clicked', async () => {
        const onPlayerChange = vi.fn();
        renderSelector({ onPlayerChange });
        const cb = await screen.findByRole('region', { name: 'CB' });

        const row = within(cb)
            .getByText(/Gabriel/)
            .closest('tr');
        if (!row) throw new Error('expected Gabriel in a table row');
        fireEvent.click(row);

        expect(onPlayerChange).toHaveBeenCalledWith(expect.objectContaining({ playerCode: 3 }));
    });
});
