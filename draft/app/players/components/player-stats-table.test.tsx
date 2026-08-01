// @vitest-environment happy-dom

/* Location: app/players/components/player-stats-table.test.tsx */

import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import { WishlistProvider } from '../../wishlist';
import { PlayerStatsTable } from './player-stats-table';

/**
 * The whole `/players` page 500s if any player's `team_code` is missing from
 * `teamsByCode`: three unguarded lookups (the team filter's sort and its label, and the
 * search filter) dereference `.name` on an `undefined`.
 *
 * Found by the fixture server's route crawl. It serves a 2024/25 team list alongside
 * players who arrived in 2025/26, so 23 of them belong to clubs that were not in the
 * Premier League that season (Sunderland and Leeds, promoted) or to no club at all (the
 * stand-ins, who were abroad). Production has not hit it because a single-season pool
 * always resolves — but the cost of ever hitting it is a blank page rather than a blank
 * cell, and `_shared/components/player.tsx:40` already guards the identical lookup with a
 * comment noting that it can miss.
 */

const ARSENAL = { code: 3, id: 1, name: 'Arsenal', short_name: 'ARS' } as FplTeam;
const CHELSEA = { code: 8, id: 6, name: 'Chelsea', short_name: 'CHE' } as FplTeam;

/** Every stat the table has a column for. The values are irrelevant; presence is not. */
const pointsBreakdown = Object.fromEntries(
    [
        'appearance',
        'assists',
        'bonus',
        'cleanSheets',
        'defensiveContribution',
        'goals',
        'goalsConceded',
        'penaltiesSaved',
        'redCards',
        'saves',
        'yellowCards',
    ].map((stat) => [stat, { stat: 0, points: 0 }]),
);

const player = (overrides: Partial<EnhancedPlayerData>): EnhancedPlayerData =>
    ({
        id: 1,
        code: 100,
        first_name: 'Bukayo',
        second_name: 'Saka',
        web_name: 'Saka',
        team_code: ARSENAL.code,
        position: 'wa',
        pointsTotal: 0,
        gameweeks: {},
        draft: { position: 'wa', pointsTotal: 0, pointsBreakdown },
        ...overrides,
    }) as unknown as EnhancedPlayerData;

/**
 * The table renders `Link`s and the wishlist controls, so it needs both a router and the
 * wishlist provider in context — the same two the real page supplies.
 */
function renderTable(players: EnhancedPlayerData[], teamsByCode: Record<number, FplTeam>) {
    const Stub = createRoutesStub([
        {
            path: '/',
            Component: () => (
                <WishlistProvider>
                    <PlayerStatsTable players={players} teamsByCode={teamsByCode} />
                </WishlistProvider>
            ),
        },
    ]);

    return render(<Stub initialEntries={['/']} />);
}

/** A player appears by their `web_name`; the team name appears beside them. */
const shown = (text: string) => screen.getAllByText(text).length;

describe('the player table when every team resolves', () => {
    it('renders a player', () => {
        renderTable([player({})], { [ARSENAL.code]: ARSENAL });

        expect(shown('Saka')).toBeGreaterThan(0);
    });

    it('names each player’s team', () => {
        renderTable(
            [
                player({}),
                player({ id: 2, code: 200, second_name: 'Palmer', web_name: 'Palmer', team_code: CHELSEA.code }),
            ],
            {
                [ARSENAL.code]: ARSENAL,
                [CHELSEA.code]: CHELSEA,
            },
        );

        expect(shown('Arsenal')).toBeGreaterThan(0);
        expect(shown('Chelsea')).toBeGreaterThan(0);
    });
});

describe('the player table when a player’s team is unknown', () => {
    // Every one of these threw before the three lookups were guarded, taking the whole
    // page down rather than the one cell that could not be filled in.
    it('still renders a player whose team is missing from the lookup', () => {
        renderTable([player({ second_name: 'Xhaka', web_name: 'Xhaka', team_code: 56 })], { [ARSENAL.code]: ARSENAL });

        expect(shown('Xhaka')).toBeGreaterThan(0);
    });

    it('still renders the players whose teams ARE known', () => {
        renderTable(
            [player({}), player({ id: 2, code: 200, second_name: 'Xhaka', web_name: 'Xhaka', team_code: 56 })],
            {
                [ARSENAL.code]: ARSENAL,
            },
        );

        expect(shown('Saka')).toBeGreaterThan(0);
        expect(shown('Xhaka')).toBeGreaterThan(0);
    });

    it('handles a player with no club at all, which is team_code 0', () => {
        // The eight stand-ins were playing abroad in 2024/25 and have no club.
        renderTable([player({ second_name: 'Palhinha', web_name: 'Palhinha', team_code: 0 })], {
            [ARSENAL.code]: ARSENAL,
        });

        expect(shown('Palhinha')).toBeGreaterThan(0);
    });

    it('handles every team being unknown, so the filter has nothing to name', () => {
        renderTable([player({ team_code: 56 }), player({ id: 2, code: 200, team_code: 2 })], {});

        expect(shown('Saka')).toBeGreaterThan(0);
    });
});

/**
 * **Not covered here: a player with no `draft` block at all.**
 *
 * That was the fixture server's *second* `/players` crash, and its cause was a harness
 * gap rather than an app one — the season rebuild was not running
 * `generateAndCacheEnhancedData`, so every player arrived without the custom position and
 * points breakdown the table reads. Fixed in `harness/rebuild-season.ts`.
 *
 * The eight `player.draft?.position ?? ''` guards in this component were added at the same
 * time and are consistent with the `player.draft?.pointsBreakdown` beside them, but they
 * are not sufficient on their own: `_shared/components/player.tsx:45` renders a
 * `PositionBadge` that calls `position.toLowerCase()` unguarded, so a player with no draft
 * data still cannot render. Hardening that path is G22, not this file's job.
 */
