// @vitest-environment happy-dom

/* Location: app/transfers/components/player-in-selector.test.tsx */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { AvailabilityByCode } from '../lib/player-availability';
import type { UpcomingFixturesByTeamCode } from '../lib/upcoming-fixtures';
import type { TransferRuleContext } from '../types/transfer-rule-types';
import { PlayerInSelector } from './player-in-selector';

/**
 * The player list a manager picks an incoming player from. The "your team" step slimmed
 * down to player, points and fixtures; this list deliberately keeps its full stats table,
 * because comparing candidates is what it is for, and shows the same fixtures beside it.
 */

const teamsByCode = {
    3: { code: 3, name: 'Arsenal', short_name: 'ARS' },
    4: { code: 4, name: 'Newcastle', short_name: 'NEW' },
    5: { code: 5, name: 'Southampton', short_name: 'SOU' },
} as unknown as Record<number, FplTeam>;

const SAKA = {
    id: 1,
    code: 223340,
    web_name: 'Saka',
    first_name: 'Bukayo',
    second_name: 'Saka',
    team_code: 3,
    draft: { position: 'wa', pointsTotal: 120, pointsBreakdown: {}, isHidden: false, isNew: false },
} as unknown as EnhancedPlayerData;

/** A club the FPL teams list does not know — e.g. a promoted club before the teams copy catches up. */
const UNKNOWN_CLUB_CODE = 56;

const NEWCOMER = {
    id: 2,
    code: 999001,
    web_name: 'Newcomer',
    first_name: 'New',
    second_name: 'Comer',
    team_code: UNKNOWN_CLUB_CODE,
    draft: { position: 'mid', pointsTotal: 10, pointsBreakdown: {}, isHidden: false, isNew: false },
} as unknown as EnhancedPlayerData;

const validationContext: Omit<TransferRuleContext, 'transfer'> = {
    allGameweekTransfers: [],
    divisionRosters: { nick: { roster: {} } } as unknown as TransferRuleContext['divisionRosters'],
    gameweekData: { fplEvent: { id: 21, deadline_time: '2099-01-01T11:00:00Z' } } as unknown as GameWeekData,
    fplPlayersByCode: { [SAKA.code]: SAKA, [NEWCOMER.code]: NEWCOMER },
    divisionId: 'premierLeague',
    currentGameweek: 21,
};

const ARSENAL_FIXTURES: UpcomingFixturesByTeamCode = {
    3: [
        { gameweek: 21, fixtures: [{ opponent: 'LIV', isHome: true, difficulty: 4 }] },
        { gameweek: 22, fixtures: [] },
        { gameweek: 23, fixtures: [{ opponent: 'MCI', isHome: false, difficulty: 5 }] },
    ],
};

function renderPlayerList({
    availablePlayers = [SAKA],
    selectedPlayer = null,
    availabilityByCode = {},
    upcomingFixturesByTeamCode = ARSENAL_FIXTURES,
}: {
    availablePlayers?: EnhancedPlayerData[];
    selectedPlayer?: EnhancedPlayerData | null;
    availabilityByCode?: AvailabilityByCode;
    upcomingFixturesByTeamCode?: UpcomingFixturesByTeamCode;
} = {}) {
    const Stub = createRoutesStub([
        {
            path: '/',
            Component: () => (
                <PlayerInSelector
                    availablePlayers={availablePlayers}
                    availabilityByCode={availabilityByCode}
                    upcomingFixturesByTeamCode={upcomingFixturesByTeamCode}
                    selectedPlayer={selectedPlayer}
                    onPlayerChange={vi.fn()}
                    transferType="TRANSFER"
                    playerOut={null}
                    ownedPlayersByCode={{}}
                    teamsByCode={teamsByCode}
                    validationContext={validationContext}
                    managerId="nick"
                    managers={[]}
                    embeddedInJourney
                />
            ),
        },
    ]);
    return render(<Stub initialEntries={['/']} />);
}

const headerNames = () =>
    screen.getAllByRole('columnheader').map((header) => header.textContent?.replace(/[^A-Za-z0-9 ]/g, '').trim());

const rowFor = async (name: string) => {
    const row = (await screen.findByText(new RegExp(name))).closest('tr');
    if (!row) throw new Error(`expected ${name} in a table row`);
    return row;
};

describe('the player list', () => {
    it('keeps its full stats table and eligibility', async () => {
        renderPlayerList();
        await screen.findByText(/Saka/);

        expect(headerNames()).toEqual(
            expect.arrayContaining(['Player', 'Pts', 'Min', 'G', 'A', 'YC', 'RC', 'DC', 'Status']),
        );
    });

    it('puts the next three fixtures straight after the points, before the stats', async () => {
        renderPlayerList();
        await screen.findByText(/Saka/);

        expect(headerNames().slice(0, 4)).toEqual(['Player', 'Pts', 'Next 3', 'Min']);
    });

    it("shows each candidate's club fixtures, home in capitals and away in lower case", async () => {
        renderPlayerList();
        const row = await rowFor('Saka');

        expect(within(row).getByTitle('GW21: LIV at home, difficulty 4')).toBeDefined();
        expect(within(row).getByTitle('No game in GW22')).toBeDefined();
        expect(within(row).getByText('mci')).toBeDefined();
    });

    it('shows a dash when the fixtures could not be loaded', async () => {
        renderPlayerList({ upcomingFixturesByTeamCode: {} });
        const row = await rowFor('Saka');

        expect(within(row).queryByText('LIV')).toBeNull();
        expect(within(row).getAllByText('–').length).toBeGreaterThan(0);
    });

    it('still lists a player whose club is missing from the teams list', async () => {
        renderPlayerList({ availablePlayers: [SAKA, NEWCOMER] });

        expect(await screen.findByRole('row', { name: /Newcomer/ })).toBeDefined();
        expect(screen.getByRole('row', { name: /Saka/ })).toBeDefined();
    });

    it('shows the selected player even when their club is missing from the teams list', async () => {
        renderPlayerList({ availablePlayers: [SAKA, NEWCOMER], selectedPlayer: NEWCOMER });

        expect(await screen.findByText('Selected:')).toBeDefined();
    });
});

describe('sorting the player list by its fixtures', () => {
    const atClub = (name: string, teamCode: number) =>
        ({
            ...SAKA,
            code: teamCode * 1000,
            web_name: name,
            second_name: name,
            team_code: teamCode,
        }) as EnhancedPlayerData;

    // Gameweek 21 from FPL's point of view: 1 is the easiest match and 5 the hardest.
    const gameweek = (difficulty: number) => [
        { gameweek: 21, fixtures: [{ opponent: 'XXX', isHome: true, difficulty }] },
    ];
    const fixtures: UpcomingFixturesByTeamCode = { 3: gameweek(3), 4: gameweek(1), 5: gameweek(5) };
    const players = [atClub('Middling', 3), atClub('Easy', 4), atClub('Hard', 5)];

    const rowNames = () =>
        screen
            .getAllByRole('row')
            .slice(1)
            .map((row) => ['Easy', 'Middling', 'Hard'].find((name) => row.textContent?.includes(name)));

    const sortByNextThree = () => fireEvent.click(screen.getByRole('columnheader', { name: /Next 3/ }));

    it('puts the easiest run of fixtures first when sorted high to low', async () => {
        renderPlayerList({ upcomingFixturesByTeamCode: fixtures, availablePlayers: players });
        await screen.findByText(/Easy/);
        sortByNextThree(); // low to high
        sortByNextThree(); // high to low

        expect(rowNames()).toEqual(['Easy', 'Middling', 'Hard']);
    });

    it('puts the hardest run first when sorted low to high', async () => {
        renderPlayerList({ upcomingFixturesByTeamCode: fixtures, availablePlayers: players });
        await screen.findByText(/Easy/);
        sortByNextThree();

        expect(rowNames()).toEqual(['Hard', 'Middling', 'Easy']);
    });
});

describe("FPL's availability on the player list", () => {
    it('flags a candidate FPL has doubts about', async () => {
        renderPlayerList({ availabilityByCode: { [SAKA.code]: { status: 'd', chanceNextRound: 50 } } });
        const row = (await screen.findByText(/Saka/)).closest('tr');

        expect(row?.querySelector('[aria-label="Doubtful: 50% chance of playing next gameweek"]')).not.toBeNull();
    });

    it('flags no one FPL expects to play', async () => {
        renderPlayerList();
        await screen.findByText(/Saka/);

        expect(screen.queryByRole('img', { name: /Doubtful|Injured|Suspended|Unavailable/ })).toBeNull();
    });
});
