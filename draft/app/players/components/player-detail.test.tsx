// @vitest-environment happy-dom

/* Location: app/players/components/player-detail.test.tsx */

import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { SeasonTotals } from '../../scoring';
import type { PlayerDetailData } from '../types/player-types';
import { PlayerDetail } from './player-detail';

/**
 * The player page's content. The `/players/:code` page and the transfer flow's player
 * modal both render this, so what it shows is tested once, here.
 */

const SALIBA: PlayerDetailData = {
    player: {
        id: 2,
        code: 462424,
        first_name: 'William',
        second_name: 'Saliba',
        web_name: 'Saliba',
        team_code: 3,
        draft: { position: 'cb', pointsTotal: 87, pointsBreakdown: {} },
    } as unknown as EnhancedPlayerData,
    team: { id: 1, name: 'Arsenal', short_name: 'ARS' },
    position: 'cb',
    gameweekStats: [],
    seasonTotals: {
        gamesPlayed: 11,
        averageMinutes: 90,
        averageCustomPoints: 7.9,
        form: 5.2,
        goals: 1,
        assists: 0,
        goalsPerGame: 0.09,
        assistsPerGame: 0,
        cleanSheets: 5,
        cleanSheetPercentage: 45,
    } as unknown as SeasonTotals,
    currentGameweek: 12,
    fixtures: [],
    fplTeamsById: {},
    fplEvents: [],
};

function renderDetail(data: PlayerDetailData) {
    const Stub = createRoutesStub([{ path: '/', Component: () => <PlayerDetail data={data} /> }]);
    return render(<Stub initialEntries={['/']} />);
}

describe("a player's details", () => {
    it('heads with the player and their season in numbers', async () => {
        renderDetail(SALIBA);

        expect(await screen.findByRole('heading', { name: /William Saliba/ })).toBeDefined();
        expect(screen.getByText('Total Points')).toBeDefined();
        expect(screen.getByText('87')).toBeDefined();
        expect(screen.getByText('Avg: 7.9/game')).toBeDefined();
        expect(screen.getByText('11')).toBeDefined();
        expect(screen.getByText('5.2')).toBeDefined();
    });

    it('has the gameweek and fixtures sections', async () => {
        renderDetail(SALIBA);

        expect(await screen.findByRole('heading', { name: 'Gameweek Performance' })).toBeDefined();
        expect(screen.getByRole('heading', { name: 'Fixtures' })).toBeDefined();
    });

    it('has no way back to the players list: that belongs to the page around it', async () => {
        renderDetail(SALIBA);
        await screen.findByRole('heading', { name: /William Saliba/ });

        expect(screen.queryByText(/Back to All Players/)).toBeNull();
    });
});
