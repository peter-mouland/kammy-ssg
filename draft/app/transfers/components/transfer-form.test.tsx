// @vitest-environment happy-dom

/* Location: app/transfers/components/transfer-form.test.tsx */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createRoutesStub, useLocation } from 'react-router';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { RosterPlayer, TeamRoster } from '../../_shared/types/squad-types';
import type { RosterByManagerId } from '../../teams';
import type { TransferRuleContext } from '../types/transfer-rule-types';
import { makePlayerDetailData } from './fixtures';
import { type JourneyPath, TransferForm } from './transfer-form';

/**
 * Looking at a player part-way through a transfer: pick them on either step, open their
 * details with "View player", come back, and carry on with the selection intact.
 */

const teamsByCode = { 3: { id: 1, code: 3, name: 'Arsenal', short_name: 'ARS' } } as unknown as Record<number, FplTeam>;

const player = (code: number, webName: string, position: string): EnhancedPlayerData =>
    ({
        id: code,
        code,
        web_name: webName,
        first_name: '',
        second_name: webName,
        team_code: 3,
        draft: { position, pointsTotal: 40, pointsBreakdown: {}, isHidden: false, isNew: false },
    }) as unknown as EnhancedPlayerData;

const SALIBA = player(2, 'Saliba', 'cb');
const RAYA = player(1, 'Raya', 'gk');
const SAKA = player(7, 'Saka', 'wa');
const AVAILABLE_PLAYERS = [RAYA, SALIBA, SAKA];

const slot = (p: EnhancedPlayerData) => ({
    player: { playerCode: p.code, playerName: p.web_name, playerPosition: p.draft.position } as RosterPlayer,
});
const roster = { gk_0: slot(RAYA), cb_0: slot(SALIBA) } as unknown as TeamRoster;

const gameweekData = {
    fplEvent: { id: 21, deadline_time: '2099-01-01T11:00:00Z' },
} as unknown as GameWeekData;

const validationContext: Omit<TransferRuleContext, 'transfer'> = {
    allGameweekTransfers: [],
    divisionRosters: { nick: { roster } } as unknown as TransferRuleContext['divisionRosters'],
    gameweekData,
    fplPlayersByCode: Object.fromEntries(AVAILABLE_PLAYERS.map((p) => [p.code, p])),
    divisionId: 'premierLeague',
    currentGameweek: 21,
};

const server = setupServer(
    http.get('*/players/:code/detail.json', ({ params }) => {
        const found = AVAILABLE_PLAYERS.find((p) => String(p.code) === params.code);
        return found
            ? HttpResponse.json(makePlayerDetailData({ code: found.code, firstName: 'Mr', secondName: found.web_name }))
            : new HttpResponse(null, { status: 404 });
    }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/** Shows the URL's search, so tests can see what a phone's Back button would act on. */
function SearchProbe() {
    return <output aria-label="search">{useLocation().search}</output>;
}

function renderJourney(journeyPath: JourneyPath, initialEntry = '/transfers?userId=nick') {
    const queryClient = new QueryClient();
    const Stub = createRoutesStub([
        {
            path: '/transfers',
            Component: () => (
                <QueryClientProvider client={queryClient}>
                    <TransferForm
                        divisions={[]}
                        managers={[]}
                        currentGameweek={21}
                        availableGameweeks={[21]}
                        selectedGameweekData={gameweekData}
                        selectedDivision="premierLeague"
                        selectedManager="nick"
                        managerRoster={roster}
                        availablePlayers={AVAILABLE_PLAYERS}
                        isBeforeDeadline
                        divisionRosters={{ nick: { roster } } as unknown as RosterByManagerId}
                        teamsByCode={teamsByCode}
                        validationContext={validationContext}
                        journeyPath={journeyPath}
                        onExit={vi.fn()}
                    />
                    <SearchProbe />
                </QueryClientProvider>
            ),
        },
    ]);
    render(<Stub initialEntries={[initialEntry]} />);
}

const search = () => screen.getByRole('status', { name: 'search' }).textContent;
const pickRow = async (name: string) => {
    const row = (await screen.findByText(new RegExp(name))).closest('tr');
    if (!row) throw new Error(`expected ${name} in a table row`);
    fireEvent.click(row);
};

describe('"View player" on the your-team step', () => {
    it('only appears once a player is selected', async () => {
        renderJourney('team-first');
        await screen.findByText(/Saliba/);

        expect(screen.queryByRole('button', { name: /View player/ })).toBeNull();
        await pickRow('Saliba');
        expect(screen.getByRole('button', { name: 'View player: Saliba' })).toBeDefined();
    });

    it("opens the selected player's details, and puts them in the URL", async () => {
        renderJourney('team-first');
        await pickRow('Saliba');
        fireEvent.click(screen.getByRole('button', { name: 'View player: Saliba' }));

        const dialog = await screen.findByRole('dialog', { name: 'Saliba' });
        expect(await within(dialog).findByRole('heading', { name: /Mr Saliba/ })).toBeDefined();
        expect(search()).toContain('player=2');
    });

    it('comes back with the player still selected, focus on "View player", and Continue still goes on', async () => {
        renderJourney('team-first');
        await pickRow('Saliba');
        const viewPlayer = screen.getByRole('button', { name: 'View player: Saliba' });
        viewPlayer.focus(); // a tap focuses the button before it clicks
        fireEvent.click(viewPlayer);
        const dialog = await screen.findByRole('dialog', { name: 'Saliba' });

        const back = within(dialog).getByRole('button', { name: '← Back' });
        back.focus(); // likewise: focus is inside the modal when it closes
        fireEvent.click(back);

        expect(await screen.findByText('Selected:')).toBeDefined();
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(search()).toBe('?userId=nick');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'View player: Saliba' }));

        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        expect(await screen.findByRole('heading', { name: 'Select player to bring in' })).toBeDefined();
    });
});

describe('"View player" on the player list', () => {
    it('opens the player picked from the list', async () => {
        renderJourney('player-list-first');
        await pickRow('Saka');
        fireEvent.click(screen.getByRole('button', { name: 'View player: Saka' }));

        const dialog = await screen.findByRole('dialog', { name: 'Saka' });
        expect(await within(dialog).findByRole('heading', { name: /Mr Saka/ })).toBeDefined();
    });
});

describe('a ?player in the URL without a selection to match', () => {
    it('opens nothing, so a reload never shows a stray modal', async () => {
        renderJourney('team-first', '/transfers?player=2');
        await screen.findByText(/Saliba/);

        expect(screen.queryByRole('dialog')).toBeNull();
    });
});
