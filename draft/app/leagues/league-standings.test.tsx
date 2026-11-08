// @vitest-environment happy-dom

/* Location: app/leagues/league-standings.test.tsx */

import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { GameWeekData } from '../_shared/lib/fpl/fpl-types';
import type { DivisionSheetData } from '../_shared/types/league-types';
import { LeagueStandings } from './league-standings';
import type { EnhancedLeagueStandingsLoaderData, LeagueStandingsTeamData } from './types/league-standings-types';

/**
 * What a manager sees on /leagues when they total up a run of gameweeks: one table for the
 * range, in place of the season, and a banner that says so with a way back.
 */

const gameweek = (id: number) =>
    ({ fplEvent: { id, name: `Gameweek ${id}` }, end: new Date('2025-01-14T18:00:00Z') }) as unknown as GameWeekData;

const division = {
    id: 'premierLeague',
    label: 'Premier League',
    order: 1,
    promotion: false,
    relegation: true,
    cup: true,
} as unknown as DivisionSheetData;

const points = (total: number) => ({ gk: total, cb: 0, fb: 0, mid: 0, wa: 0, ca: 0, total });

const team = (userId: string, userName: string, total: number): LeagueStandingsTeamData => ({
    userId,
    userName,
    teamName: `${userName} FC`,
    gameweekPoints: points(total),
    seasonPoints: points(total * 10),
});

const pageData = (overrides: Partial<EnhancedLeagueStandingsLoaderData> = {}) => ({
    divisions: [division],
    selectedDivision: division,
    selectedGameweek: 3,
    selectedGameweekData: gameweek(3),
    currentGameweek: 3,
    currentGameweekData: gameweek(3),
    availableGameweeks: [1, 2, 3],
    standingsData: { premierLeague: [team('bob', 'Bob', 20), team('ann', 'Ann', 6)] },
    selectedRange: null,
    userTeams: [],
    persistedUser: { selectedUserId: 'ann', requiresSelection: false },
    ...overrides,
});

function renderPage(url: string, data: ReturnType<typeof pageData>) {
    const Stub = createRoutesStub([{ path: '/leagues/:divisionId?', Component: LeagueStandings, loader: () => data }]);
    return render(<Stub initialEntries={[url]} />);
}

describe('viewing a range of gameweeks', () => {
    const rangeData = pageData({ selectedGameweek: 3, selectedRange: { from: 2, to: 3 } });

    it('titles the table with the range', async () => {
        renderPage('/leagues/premierLeague?from=2&to=3', rangeData);

        expect(await screen.findByText(/Gameweeks 2-3/)).toBeDefined();
        expect(screen.getByText('Points scored during gameweeks 2-3')).toBeDefined();
    });

    it('keeps the division title', async () => {
        renderPage('/leagues/premierLeague?from=2&to=3', rangeData);

        expect(await screen.findByText('Premier League Standings')).toBeDefined();
    });

    it('hides the season standings and the single gameweek table', async () => {
        renderPage('/leagues/premierLeague?from=2&to=3', rangeData);
        await screen.findByText(/Gameweeks 2-3/);

        expect(screen.queryByText(/Season Standings/)).toBeNull();
        expect(screen.queryByText(/⚡ Gameweek 3/)).toBeNull();
    });

    it('says a range is on screen, with a way back', async () => {
        renderPage('/leagues/premierLeague?from=2&to=3', rangeData);

        expect(await screen.findByText(/Viewing a range of gameweeks/)).toBeDefined();
        expect(screen.getByRole('button', { name: 'Back to Current' })).toBeDefined();
    });
});

describe('the gameweeks a range covers', () => {
    it('lists each gameweek with when its points were scored, in UK time', async () => {
        renderPage(
            '/leagues/premierLeague?from=2&to=3',
            pageData({
                selectedRange: { from: 2, to: 3 },
                rangeGameweeks: [
                    { gameweek: 2, from: '2024-08-24T10:00:00.000Z', to: '2024-08-31T10:00:00.000Z' },
                    { gameweek: 3, from: '2024-08-31T10:00:00.000Z', to: '2024-09-14T10:00:00.000Z' },
                ],
            }),
        );

        expect(await screen.findByRole('heading', { name: 'Gameweeks in this range' })).toBeDefined();
        const gw3 = screen.getByRole('row', { name: /GW 3/ });
        expect(gw3.textContent).toContain('Sat 31 Aug, 11:00');
        expect(gw3.textContent).toContain('Sat 14 Sept, 11:00');
    });

    it('says when the last gameweek runs to the end of the season', async () => {
        renderPage(
            '/leagues/premierLeague?from=38&to=38',
            pageData({
                selectedRange: { from: 38, to: 38 },
                rangeGameweeks: [{ gameweek: 38, from: '2025-05-25T14:30:00.000Z', to: null }],
            }),
        );

        const gw38 = await screen.findByRole('row', { name: /GW 38/ });
        expect(gw38.textContent).toContain('End of season');
    });
});

describe('the normal page', () => {
    it('shows the season standings and the gameweek, with no banner', async () => {
        renderPage('/leagues/premierLeague', pageData());

        expect(await screen.findByText(/Season Standings/)).toBeDefined();
        expect(screen.getByText(/⚡ Gameweek 3/)).toBeDefined();
        expect(screen.queryByRole('button', { name: 'Back to Current' })).toBeNull();
        expect(screen.queryByText('Gameweeks in this range')).toBeNull();
    });
});
