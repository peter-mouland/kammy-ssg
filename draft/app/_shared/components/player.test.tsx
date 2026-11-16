// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { FplTeam } from '../lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../types/player-types';
import type { RosterPlayer } from '../types/squad-types';
import { PlayerSummary } from './player';

/**
 * The Player cell every table uses. It is kept narrow by putting everything except the
 * name and club on the photo, and by showing the club as its short code -- so these
 * check that nothing a user relied on was lost in the squeeze.
 */

const ARSENAL = { code: 3, id: 1, name: 'Arsenal', short_name: 'ARS' } as FplTeam;
const teamsByCode = { [ARSENAL.code]: ARSENAL };

const fplPlayer = (draft: Partial<EnhancedPlayerData['draft']> = {}): EnhancedPlayerData =>
    ({
        id: 1,
        code: 100,
        web_name: 'Saka',
        team_code: ARSENAL.code,
        draft: { position: 'wa', ...draft },
    }) as unknown as EnhancedPlayerData;

const squadPlayer = (overrides: Partial<RosterPlayer> = {}): RosterPlayer & Partial<EnhancedPlayerData> => ({
    playerId: 1,
    playerCode: 100,
    playerName: 'Saka',
    playerPosition: 'wa',
    teamPosition: 'wa',
    teamSlotIndex: 0,
    isSub: false,
    onLoanTo: null,
    onLoanFrom: null,
    onLoanStart: null,
    assignedAt: '2024-08-01',
    team_code: ARSENAL.code,
    ...overrides,
});

describe('the Player cell', () => {
    it('shows the player’s name and position', () => {
        render(<PlayerSummary player={fplPlayer()} teamsByCode={teamsByCode} />);

        expect(screen.getByText('Saka')).toBeDefined();
        expect(screen.getByText('wa')).toBeDefined();
    });

    it('shows the club as its short code, with the full name on hover and for screen readers', () => {
        render(<PlayerSummary player={fplPlayer()} teamsByCode={teamsByCode} />);

        expect(screen.getByText('ARS')).toBeDefined();
        expect(screen.getByTitle('Arsenal').textContent).toBe('ARS');
        expect(screen.getByText('Arsenal')).toBeDefined();
    });

    it('renders an empty club when the club cannot be found', () => {
        render(<PlayerSummary player={fplPlayer()} teamsByCode={{}} />);

        expect(screen.getByText('Saka')).toBeDefined();
        expect(screen.queryByText('ARS')).toBeNull();
    });
});

describe('the tag after the club code', () => {
    it('marks a new player', () => {
        render(<PlayerSummary player={fplPlayer({ isNew: true })} teamsByCode={teamsByCode} />);

        expect(screen.getByText('New')).toBeDefined();
    });

    it('shows Loan, not New, when a loaned player is still flagged new', () => {
        // The new flag is cleared by hand once a player joins a squad, so it can lag.
        render(<PlayerSummary player={fplPlayer({ isNew: true })} teamsByCode={teamsByCode} onLoanTo="Bob" />);

        expect(screen.getByText('Loan')).toBeDefined();
        expect(screen.queryByText('New')).toBeNull();
    });

    it('shows nothing for a sub who is neither new nor on loan', () => {
        // Where a squad is shown, the sub is already clear from its group or status column.
        render(<PlayerSummary player={squadPlayer({ isSub: true })} teamsByCode={teamsByCode} />);

        expect(screen.queryByText('New')).toBeNull();
        expect(screen.queryByText('Loan')).toBeNull();
        expect(screen.queryByText(/^s(ub)?$/i)).toBeNull();
    });
});

describe('the loan chip', () => {
    it('says who a player is on loan to', () => {
        render(<PlayerSummary player={fplPlayer()} teamsByCode={teamsByCode} onLoanTo="Bob" />);

        expect(screen.getByText('Loan')).toBeDefined();
        expect(screen.getByTitle('On Loan to Bob')).toBeDefined();
        expect(screen.getByText('On Loan to Bob')).toBeDefined();
    });

    it('says who a player is on loan from', () => {
        render(<PlayerSummary player={fplPlayer()} teamsByCode={teamsByCode} onLoanFrom="Ann" />);

        expect(screen.getByText('On Loan from Ann')).toBeDefined();
    });

    it('is absent when the player is not on loan', () => {
        render(<PlayerSummary player={fplPlayer()} teamsByCode={teamsByCode} />);

        expect(screen.queryByText('Loan')).toBeNull();
    });
});
