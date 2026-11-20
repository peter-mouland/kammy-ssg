/* Location: app/transfers/lib/fixture-ease.test.ts */

import { describe, expect, it } from 'vitest';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import { compareByFixtureEase, fixtureRunEase, gameweekEase } from './fixture-ease';
import type { UpcomingFixture, UpcomingFixturesByTeamCode, UpcomingGameweek } from './upcoming-fixtures';

const match = (difficulty: number): UpcomingFixture => ({ opponent: 'XXX', isHome: true, difficulty });

/** A run of gameweeks from 21, each given as its matches' FPL difficulties: [] is a blank. */
const run = (...gameweeks: number[][]): UpcomingGameweek[] =>
    gameweeks.map((difficulties, index) => ({ gameweek: 21 + index, fixtures: difficulties.map(match) }));

const player = (name: string, teamCode: number, pointsTotal = 50) =>
    ({ web_name: name, team_code: teamCode, draft: { pointsTotal } }) as unknown as EnhancedPlayerData;

const sortNames = (
    players: EnhancedPlayerData[],
    fixtures: UpcomingFixturesByTeamCode,
    direction: 'asc' | 'desc' = 'desc',
) => [...players].sort(compareByFixtureEase(fixtures, direction)).map((p) => p.web_name);

describe('how easy a gameweek is', () => {
    it("scores the easiest match 5 and the hardest 1, flipping FPL's scale", () => {
        expect(gameweekEase(run([1])[0])).toBe(5);
        expect(gameweekEase(run([3])[0])).toBe(3);
        expect(gameweekEase(run([5])[0])).toBe(1);
    });

    it('scores a blank 0, worse than the hardest match', () => {
        expect(gameweekEase(run([])[0])).toBe(0);
    });

    it('adds both matches of a double, so two games beat one', () => {
        expect(gameweekEase(run([2, 4])[0])).toBe(4 + 2);
    });
});

describe('how easy a run is', () => {
    it('adds up the gameweeks', () => {
        expect(fixtureRunEase(run([1], [], [3, 5]))).toEqual({ total: 5 + 0 + 4, byGameweek: [5, 0, 4] });
    });

    it('is unknown when there are no fixtures', () => {
        expect(fixtureRunEase(undefined)).toBeNull();
        expect(fixtureRunEase([])).toBeNull();
    });
});

describe('sorting players by fixture ease', () => {
    it('puts the easiest run first, high to low', () => {
        const fixtures = { 1: run([5], [5], [5]), 2: run([1], [1], [1]), 3: run([3], [3], [3]) };

        expect(sortNames([player('Hard', 1), player('Easy', 2), player('Middling', 3)], fixtures)).toEqual([
            'Easy',
            'Middling',
            'Hard',
        ]);
    });

    it('breaks a tie on the total with the first gameweek, easier first', () => {
        // Both total 9: 5 + 3 + 1 against 1 + 3 + 5.
        const fixtures = { 1: run([5], [3], [1]), 2: run([1], [3], [5]) };

        expect(sortNames([player('Late', 1), player('Early', 2)], fixtures)).toEqual(['Early', 'Late']);
    });

    it('then with the second gameweek', () => {
        // Same total and first gameweek: 3 + 5 + 1 against 3 + 1 + 5.
        const fixtures = { 1: run([3], [5], [1]), 2: run([3], [1], [5]) };

        expect(sortNames([player('Later', 1), player('Sooner', 2)], fixtures)).toEqual(['Sooner', 'Later']);
    });

    it('then by season points, higher first, for players at the same club', () => {
        const fixtures = { 1: run([2], [2], [2]) };

        expect(sortNames([player('Fewer', 1, 30), player('More', 1, 80)], fixtures)).toEqual(['More', 'Fewer']);
    });

    it('and finally by name, A to Z', () => {
        const fixtures = { 1: run([2], [2], [2]) };

        expect(sortNames([player('Zinchenko', 1), player('Arteta', 1)], fixtures)).toEqual(['Arteta', 'Zinchenko']);
    });

    it('low to high flips the fixtures only: points and names keep their order', () => {
        const fixtures = { 1: run([1], [1], [1]), 2: run([5], [5], [5]) };
        const players = [
            player('Easy', 1),
            player('Hard B', 2, 40),
            player('Hard A', 2, 40),
            player('Hard top', 2, 90),
        ];

        expect(sortNames(players, fixtures, 'asc')).toEqual(['Hard top', 'Hard A', 'Hard B', 'Easy']);
    });

    it('puts players whose fixtures are unknown last, either way round', () => {
        const fixtures = { 1: run([1], [1], [1]), 2: run([5], [5], [5]) };
        const players = [player('Unknown', 99, 200), player('Easy', 1), player('Hard', 2)];

        expect(sortNames(players, fixtures, 'desc')).toEqual(['Easy', 'Hard', 'Unknown']);
        expect(sortNames(players, fixtures, 'asc')).toEqual(['Hard', 'Easy', 'Unknown']);
    });
});
