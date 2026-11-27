// @vitest-environment happy-dom

/* Location: app/transfers/components/transfer-form.test.tsx */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createRoutesStub, useLocation } from 'react-router';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { setNow } from '../../_shared/lib/clock';
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

type TransferFormProps = React.ComponentProps<typeof TransferForm>;

function renderJourney(
    journeyPath: JourneyPath,
    initialEntry = '/transfers?userId=nick',
    overrides: Partial<TransferFormProps> = {},
) {
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
                        submissionGameweek={gameweekData}
                        divisionRosters={{ nick: { roster } } as unknown as RosterByManagerId}
                        teamsByCode={teamsByCode}
                        validationContext={validationContext}
                        journeyPath={journeyPath}
                        onExit={vi.fn()}
                        {...overrides}
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

/**
 * The review step, where a manager decides whether to press Submit. Nothing is blocked:
 * rule warnings explain themselves, and the deadline says what the transfer counts towards.
 */

const MARTINELLI = player(11, 'Martinelli', 'wa');
const ANDY_OWNS_SAKA = {
    nick: { roster: { ...roster, wa_0: slot(MARTINELLI) } },
    andy: { roster: { wa_0: slot(SAKA) } },
} as unknown as RosterByManagerId;
const MANAGERS = [
    { userId: 'nick', userName: 'Nick', divisionId: 'premierLeague' },
    { userId: 'andy', userName: 'Andy', divisionId: 'premierLeague' },
] as unknown as TransferFormProps['managers'];
const GW21 = { fplEvent: { id: 21, deadline_time: '2025-01-14T18:00:00Z' } } as unknown as GameWeekData;
const GW22 = { fplEvent: { id: 22, deadline_time: '2025-01-18T11:00:00Z' } } as unknown as GameWeekData;

const reviewProps: Partial<TransferFormProps> = {
    managers: MANAGERS,
    divisionRosters: ANDY_OWNS_SAKA,
    managerRoster: ANDY_OWNS_SAKA.nick.roster,
    availablePlayers: [...AVAILABLE_PLAYERS, MARTINELLI],
    submissionGameweek: GW21,
    validationContext: {
        ...validationContext,
        divisionRosters: ANDY_OWNS_SAKA as unknown as TransferRuleContext['divisionRosters'],
        fplPlayersByCode: Object.fromEntries([...AVAILABLE_PLAYERS, MARTINELLI].map((p) => [p.code, p])),
    },
};

const deadlineNotice = () => screen.getByRole('note', { name: 'Deadline' }).textContent;
/** The notice as a manager reads it, one line at a time. */
const deadlineLines = () =>
    Array.from(screen.getByRole('note', { name: 'Deadline' }).children, (line) => line.textContent);

async function reviewSakaForMartinelli(overrides: Partial<TransferFormProps> = {}) {
    renderJourney('player-list-first', undefined, { ...reviewProps, ...overrides });
    await pickRow('Saka');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { name: 'Select player to remove' });
    await pickRow('Martinelli');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { name: 'Review and submit' });
}

describe('the review step', () => {
    afterEach(() => setNow(null));

    it('says in words why a player breaks a rule, and still lets the manager submit', async () => {
        setNow('2025-01-10T12:00:00Z');
        await reviewSakaForMartinelli();

        expect(screen.getByText(/Owned by Andy — this player isn't available/)).toBeDefined();
        expect((screen.getByRole('button', { name: 'Submit' }) as HTMLButtonElement).disabled).toBe(false);
    });

    it('states the deadline and the gameweek an approved transfer starts scoring in', async () => {
        setNow('2025-01-10T12:00:00Z');
        await reviewSakaForMartinelli();

        expect(deadlineLines()).toEqual([
            'Deadline: Tue 14/01/2025 18:00 (UK time)',
            'If approved, transfers submitted before this deadline start scoring in GW21.',
        ]);
        expect(screen.queryByText(/left$/)).toBeNull();
    });

    it('counts down in the last five minutes, and says the timer is only as good as the device clock', async () => {
        setNow('2025-01-14T17:55:28Z');
        await reviewSakaForMartinelli();

        expect(deadlineNotice()).toContain('4m 32s left');
        expect(
            screen.getByText('Timer runs from your device clock, so may differ from the true deadline countdown.'),
        ).toBeDefined();
    });

    it('says the transfer will count next week once the deadline passes with the review open', async () => {
        setNow('2025-01-14T17:59:59Z');
        await reviewSakaForMartinelli();
        expect(deadlineNotice()).toContain('1s left');

        setNow('2025-01-14T18:00:01Z');

        await waitFor(
            () =>
                expect(deadlineLines()).toEqual([
                    'Deadline for GW21: Tue 14/01/2025 18:00',
                    "Changes submitted after the deadline will count in the following week's transfer window.",
                ]),
            { timeout: 2500 },
        );
        expect((screen.getByRole('button', { name: 'Submit' }) as HTMLButtonElement).disabled).toBe(false);
    });

    it('says the deadline has just passed when the review is reached within five minutes of it', async () => {
        setNow('2025-01-14T18:02:00Z');
        await reviewSakaForMartinelli({ submissionGameweek: GW22, previousGameweek: GW21 });

        expect(deadlineLines()).toEqual([
            'Deadline for GW21: Tue 14/01/2025 18:00',
            "Changes submitted after the deadline will count in the following week's transfer window.",
        ]);
    });

    it('shows the next deadline once five minutes have gone', async () => {
        setNow('2025-01-14T18:06:00Z');
        await reviewSakaForMartinelli({ submissionGameweek: GW22, previousGameweek: GW21 });

        expect(deadlineLines()).toEqual([
            'Deadline: Sat 18/01/2025 11:00 (UK time)',
            'If approved, transfers submitted before this deadline start scoring in GW22.',
        ]);
    });

    it('no longer shows the old "Missed the Deadline" warning', async () => {
        setNow('2025-01-14T18:30:00Z');
        await reviewSakaForMartinelli();

        expect(screen.queryByText(/Missed the Deadline/)).toBeNull();
    });
});

describe('the player list once the weekly transfers are used up', () => {
    afterEach(() => setNow(null));

    it('shows the limit against a free agent, not "Free Agent"', async () => {
        const PALMER = { ...player(20, 'Palmer', 'mid'), team_code: 8 } as EnhancedPlayerData;
        const usedTransfer = (id: string) => ({
            id,
            managerId: 'nick',
            transferType: 'TRANSFER',
            status: 'PENDING',
            timestamp: new Date('2025-01-09T10:00:00Z'),
            gameweekData,
        });
        setNow('2025-01-10T12:00:00Z');
        renderJourney('player-list-first', undefined, {
            availablePlayers: [...AVAILABLE_PLAYERS, PALMER],
            teamsByCode: {
                ...teamsByCode,
                8: { id: 7, code: 8, name: 'Chelsea', short_name: 'CHE' },
            } as unknown as TransferFormProps['teamsByCode'],
            validationContext: {
                ...validationContext,
                fplPlayersByCode: Object.fromEntries([...AVAILABLE_PLAYERS, PALMER].map((p) => [p.code, p])),
                allGameweekTransfers: [
                    usedTransfer('t1'),
                    usedTransfer('t2'),
                ] as TransferRuleContext['allGameweekTransfers'],
            },
        });

        const palmerRow = (await screen.findByText(/Palmer/)).closest('tr') as HTMLElement;
        expect(within(palmerRow).getByText(/\/2 transfers/)).toBeDefined();
    });
});

/**
 * A player new to the game goes to a draw (rules 3.7–3.9). Picking one switches the
 * request to New Player Request and explains what that means; nothing is blocked.
 */
describe('a new player', () => {
    afterEach(() => setNow(null));

    const NEWBIE = {
        ...player(30, 'Newbie', 'wa'),
        team_code: 9,
        draft: { position: 'wa', pointsTotal: 0, pointsBreakdown: {}, isHidden: false, isNew: true },
    } as unknown as EnhancedPlayerData;
    const players = [...AVAILABLE_PLAYERS, MARTINELLI, NEWBIE];
    const andyRequest = {
        id: 'andy-request',
        managerId: 'andy',
        transferType: 'NEW_PLAYER',
        status: 'PENDING',
        playerIn: NEWBIE,
        playerOut: SAKA,
        timestamp: new Date('2025-01-09T10:00:00Z'),
        gameweekData: GW21,
    };
    /** Andy has asked for Newbie, so his pending request shows him in Andy's squad. */
    const rosters = {
        nick: { roster: { ...roster, wa_0: slot(MARTINELLI) } },
        andy: { roster: { wa_0: slot(NEWBIE) } },
    } as unknown as RosterByManagerId;
    const newPlayerProps: Partial<TransferFormProps> = {
        ...reviewProps,
        availablePlayers: players,
        teamsByCode: {
            ...teamsByCode,
            9: { id: 8, code: 9, name: 'Everton', short_name: 'EVE' },
        } as unknown as TransferFormProps['teamsByCode'],
        divisionRosters: rosters,
        managerRoster: rosters.nick.roster,
        validationContext: {
            ...validationContext,
            gameweekData: GW21,
            divisionRosters: rosters as unknown as TransferRuleContext['divisionRosters'],
            fplPlayersByCode: Object.fromEntries(players.map((p) => [p.code, p])),
            allGameweekTransfers: [andyRequest] as unknown as TransferRuleContext['allGameweekTransfers'],
        },
    };

    async function reviewNewbieForMartinelli() {
        renderJourney('player-list-first', undefined, newPlayerProps);
        await pickRow('Newbie');
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        await screen.findByRole('heading', { name: 'Select player to remove' });
        await pickRow('Martinelli');
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        await screen.findByRole('heading', { name: 'Review and submit' });
    }

    it('shows as a draw in the player list, not as owned by a manager who has only asked for him', async () => {
        setNow('2025-01-10T12:00:00Z');
        renderJourney('player-list-first', undefined, newPlayerProps);

        const row = (await screen.findByText(/Newbie/)).closest('tr') as HTMLElement;
        // The name already carries a "New" chip; this is the Status cell, found by its tooltip.
        expect(within(row).getByTitle('New to the game: request him to enter the draw').textContent).toBe('New');
        expect(within(row).queryByText('Andy')).toBeNull();
    });

    it('switches the request to New Player Request when picked', async () => {
        setNow('2025-01-10T12:00:00Z');
        renderJourney('player-list-first', undefined, newPlayerProps);
        await pickRow('Newbie');

        expect(screen.getByText('New Player Request')).toBeDefined();
    });

    it('explains the draw on review, with how many others have asked for him, and raises no warnings', async () => {
        setNow('2025-01-10T12:00:00Z');
        await reviewNewbieForMartinelli();

        const panel = screen.getByRole('note', { name: 'New player draw' });
        expect(within(panel).getByText('This is a request for a draw')).toBeDefined();
        expect(panel.textContent).toContain('1 other manager has asked for him.');
        expect(panel.textContent).toContain("If you win, it uses one of next week's two transfers");
        expect(screen.queryByText(/Owned by/)).toBeNull();
        expect(deadlineLines()).toEqual([
            'Deadline: Tue 14/01/2025 18:00 (UK time)',
            'Requests submitted before this deadline go into the draw made shortly after it.',
        ]);
    });

    it('warns, in red, if the type is changed back to a normal transfer', async () => {
        setNow('2025-01-10T12:00:00Z');
        renderJourney('player-list-first', undefined, newPlayerProps);
        await pickRow('Newbie');
        fireEvent.click(screen.getByText('New Player Request'));
        fireEvent.click(await screen.findByText('Standard player transfer'));
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        await screen.findByRole('heading', { name: 'Select player to remove' });
        await pickRow('Martinelli');
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        await screen.findByRole('heading', { name: 'Review and submit' });

        expect(screen.getByText(/New players go to a draw — choose New Player Request/)).toBeDefined();
        expect((screen.getByRole('button', { name: 'Submit' }) as HTMLButtonElement).disabled).toBe(false);
    });
});
