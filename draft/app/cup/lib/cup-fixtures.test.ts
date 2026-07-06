/* Location: app/cup/lib/cup-fixtures.test.ts */

import { describe, expect, it } from 'vitest';
import type { FplFixtureData, FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { buildCupFixtures } from './cup-fixtures';

const TEAMS = [
    { id: 1, short_name: 'ARS' },
    { id: 2, short_name: 'CHE' },
    { id: 3, short_name: 'LIV' },
] as unknown as FplTeam[];

const FIXTURES = [
    {
        event: 24,
        team_h: 1,
        team_a: 2,
        kickoff_time: 'T1',
        started: true,
        finished: true,
        team_h_score: 2,
        team_a_score: 1,
    },
    {
        event: 24,
        team_h: 3,
        team_a: 1,
        kickoff_time: 'T2',
        started: false,
        finished: false,
        team_h_score: 0,
        team_a_score: 0,
    },
    {
        event: 25,
        team_h: 2,
        team_a: 3,
        kickoff_time: 'T3',
        started: false,
        finished: false,
        team_h_score: 0,
        team_a_score: 0,
    },
] as unknown as FplFixtureData[];

describe('buildCupFixtures', () => {
    it('returns only the requested gameweek, with team names resolved', () => {
        const result = buildCupFixtures(FIXTURES, TEAMS, 24);
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ home: 'ARS', away: 'CHE' });
    });

    it('shows scores only once a fixture has started', () => {
        const [played, upcoming] = buildCupFixtures(FIXTURES, TEAMS, 24);
        expect(played).toMatchObject({ homeScore: 2, awayScore: 1, finished: true });
        expect(upcoming).toMatchObject({ homeScore: null, awayScore: null, started: false });
    });
});
