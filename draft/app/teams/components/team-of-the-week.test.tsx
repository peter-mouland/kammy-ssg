// @vitest-environment happy-dom

/* Location: app/teams/components/team-of-the-week.test.tsx */

import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { TeamOfTheWeekData } from '../../leagues';
import { TeamOfTheWeek } from './team-of-the-week';

/**
 * The TOTW tab draws its players with the same card as My Team, so a user sees the same
 * things on both: the full club name, the owning manager and a points pill.
 */

const teamsByCode = {
    3: { code: 3, name: 'Arsenal', short_name: 'ARS' },
    14: { code: 14, name: 'Liverpool', short_name: 'LIV' },
} as unknown as Record<number, FplTeam>;

const fplPlayer = (code: number, webName: string, teamCode: number): EnhancedPlayerData =>
    ({
        id: code,
        code,
        web_name: webName,
        team_code: teamCode,
        first_name: '',
        second_name: webName,
    }) as unknown as EnhancedPlayerData;

const fplPlayersByCode = {
    223340: fplPlayer(223340, 'Saka', 3),
    118748: fplPlayer(118748, 'Salah', 14),
};

const totw: TeamOfTheWeekData = {
    gameweek: 21,
    players: {
        gk: [],
        cb: [],
        fb: [],
        mid: [],
        wa: [
            { code: 223340, web_name: 'Saka', team_code: 3, position: 'wa', points: 12, manager_name: 'Nick' },
            { code: 118748, web_name: 'Salah', team_code: 14, position: 'wa', points: -1 },
        ],
        ca: [],
    },
    teamsByCode: { 3: { short_name: 'ARS' }, 14: { short_name: 'LIV' } },
};

function renderTotw() {
    const Stub = createRoutesStub([
        {
            path: '/',
            Component: () => (
                <TeamOfTheWeek data={totw} teamsByCode={teamsByCode} fplPlayersByCode={fplPlayersByCode} />
            ),
        },
    ]);

    return render(<Stub initialEntries={['/']} />);
}

describe('Team of the Week', () => {
    it('names the gameweek', async () => {
        renderTotw();

        expect(await screen.findByText('Team of the Week — GW21')).toBeDefined();
    });

    it('shows each player with their full club name and points', async () => {
        renderTotw();

        expect(await screen.findByText('Saka')).toBeDefined();
        expect(screen.getByText('Arsenal')).toBeDefined();
        expect(screen.getByText('12 pts')).toBeDefined();

        expect(screen.getByText('Salah')).toBeDefined();
        expect(screen.getByText('Liverpool')).toBeDefined();
        expect(screen.getByText('-1 pts')).toBeDefined();
    });

    it('shows the manager who owns a player', async () => {
        renderTotw();

        expect(await screen.findByText('Nick')).toBeDefined();
    });

    it('says a player nobody owns is a free agent', async () => {
        renderTotw();

        const salah = (await screen.findByText('Salah')).closest('a');
        expect(salah?.textContent).toContain('Free Agent');
        expect(screen.getAllByText('Free Agent')).toHaveLength(1);
    });

    it('links each card to the player page', async () => {
        renderTotw();

        const saka = (await screen.findByText('Saka')).closest('a');
        expect(saka?.getAttribute('href')).toBe('/players/223340');
    });
});
