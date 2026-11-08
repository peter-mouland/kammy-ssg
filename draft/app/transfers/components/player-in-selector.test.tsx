// @vitest-environment happy-dom

/* Location: app/transfers/components/player-in-selector.test.tsx */

import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { TransferRuleContext } from '../types/transfer-rule-types';
import { PlayerInSelector } from './player-in-selector';

/**
 * The player list a manager picks an incoming player from. The "your team" step slimmed
 * down to player, points and fixtures; this list deliberately keeps its full stats table,
 * because comparing candidates is what it is for.
 */

const teamsByCode = { 3: { code: 3, name: 'Arsenal', short_name: 'ARS' } } as unknown as Record<number, FplTeam>;

const SAKA = {
    id: 1,
    code: 223340,
    web_name: 'Saka',
    first_name: 'Bukayo',
    second_name: 'Saka',
    team_code: 3,
    draft: { position: 'wa', pointsTotal: 120, pointsBreakdown: {}, isHidden: false, isNew: false },
} as unknown as EnhancedPlayerData;

const validationContext: Omit<TransferRuleContext, 'transfer'> = {
    allGameweekTransfers: [],
    divisionRosters: { nick: { roster: {} } } as unknown as TransferRuleContext['divisionRosters'],
    gameweekData: { fplEvent: { id: 21, deadline_time: '2099-01-01T11:00:00Z' } } as unknown as GameWeekData,
    fplPlayersByCode: { [SAKA.code]: SAKA },
    divisionId: 'premierLeague',
    currentGameweek: 21,
};

function renderPlayerList() {
    const Stub = createRoutesStub([
        {
            path: '/',
            Component: () => (
                <PlayerInSelector
                    availablePlayers={[SAKA]}
                    selectedPlayer={null}
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

describe('the player list', () => {
    it('keeps its full stats table and eligibility, without the fixtures column', async () => {
        renderPlayerList();
        await screen.findByText(/Saka/);
        const headers = screen
            .getAllByRole('columnheader')
            .map((header) => header.textContent?.replace(/[^A-Za-z0-9 ]/g, '').trim());

        expect(headers).toEqual(expect.arrayContaining(['Player', 'Pts', 'Min', 'G', 'A', 'YC', 'RC', 'DC', 'Status']));
        expect(headers).not.toContain('Next 3');
    });
});
