import { describe, expect, it } from 'vitest';
import type { FplPlayerGameweekData } from '../../_shared/lib/fpl/fpl-types';
import type { CustomPosition } from '../../_shared/types/league-types';
import {
    calculateBonus,
    calculateDefensiveContribution,
    calculateGameweekPoints,
    calculateGoalsConcededPenalty,
    calculateSavesBonus,
    calculateSeasonPoints,
    getFullBreakdown,
} from './calculations';
import { convertToPlayerGameweekStats } from './data-conversion';

// ---------------------------------------------------------------------------
// calculateDefensiveContribution
// ---------------------------------------------------------------------------

// We compute CBIT/CBIRT ourselves from the raw components and key the metric off OUR
// custom position: defenders (cb/fb) use CBIT (10+ = +1, recoveries excluded);
// midfielders (mid) use CBIRT (12+ = +2, recoveries included). This must NOT rely on
// FPL's aggregate, which bakes in FPL's own position.
const raw = (clearancesBlocksInterceptions: number, tackles: number, recoveries: number) => ({
    clearancesBlocksInterceptions,
    tackles,
    recoveries,
});

describe('calculateDefensiveContribution', () => {
    // Same input, only the position changes: isolates that CB/FB use CBIT vs a
    // threshold of 10 while MID uses CBIRT vs 12. raw(6,4,0) is 10 CBIT / 10 CBIRT.
    it('scores the same input differently by position (10 CBIT/CBIRT, no recoveries)', () => {
        expect(calculateDefensiveContribution(raw(6, 4, 0), 'cb')).toBe(1); // 10 >= 10
        expect(calculateDefensiveContribution(raw(6, 4, 0), 'fb')).toBe(1); // 10 >= 10
        expect(calculateDefensiveContribution(raw(6, 4, 0), 'mid')).toBe(0); // 10 < 12
        expect(calculateDefensiveContribution(raw(6, 4, 0), 'gk')).toBe(0); // no rule
    });

    // Defender boundary: only CBIT changes (recoveries fixed at 0).
    it('awards a defender +1 exactly at the CBIT threshold of 10, not below', () => {
        expect(calculateDefensiveContribution(raw(5, 4, 0), 'fb')).toBe(0); // 9
        expect(calculateDefensiveContribution(raw(5, 5, 0), 'fb')).toBe(1); // 10
        expect(calculateDefensiveContribution(raw(5, 5, 0), 'cb')).toBe(1); // 10
    });

    // Counter-case: recoveries must NOT lift a defender over the line.
    it('ignores recoveries for a defender (9 CBIT + 9 recoveries stays 0)', () => {
        expect(calculateDefensiveContribution(raw(5, 4, 9), 'fb')).toBe(0); // CBIT 9, recoveries ignored
    });

    // Midfielder boundary: only CBIRT changes.
    it('awards a midfielder +2 exactly at the CBIRT threshold of 12, not below', () => {
        expect(calculateDefensiveContribution(raw(6, 5, 0), 'mid')).toBe(0); // 11
        expect(calculateDefensiveContribution(raw(6, 5, 1), 'mid')).toBe(2); // 12
    });

    // Counter-case: for a midfielder ONLY recoveries change, proving they count.
    it('counts recoveries for a midfielder (the Matheus Nunes case)', () => {
        expect(calculateDefensiveContribution(raw(6, 4, 1), 'mid')).toBe(0); // 10 CBIT + 1 = 11 < 12
        expect(calculateDefensiveContribution(raw(6, 4, 2), 'mid')).toBe(2); // 10 CBIT + 2 = 12
    });

    it('returns 0 for positions with no defensive-contribution rule (gk, wa, ca)', () => {
        expect(calculateDefensiveContribution(raw(20, 20, 20), 'gk')).toBe(0);
        expect(calculateDefensiveContribution(raw(20, 20, 20), 'wa')).toBe(0);
        expect(calculateDefensiveContribution(raw(20, 20, 20), 'ca')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// calculateGoalsConcededPenalty
// ---------------------------------------------------------------------------

describe('calculateGoalsConcededPenalty', () => {
    // Rule: 0 goals conceded = 0pts (handled by clean sheet separately)
    //       1st goal conceded = 0pts (free goal)
    //       2nd goal conceded = -1pt
    //       3rd goal conceded = -2pts (cumulative)
    // Formula: goalsConceded * penalty + 1, where penalty = -1

    it('returns 0 for 0 goals conceded', () => {
        expect(calculateGoalsConcededPenalty(0, 'gk')).toBe(0);
        expect(calculateGoalsConcededPenalty(0, 'cb')).toBe(0);
        expect(calculateGoalsConcededPenalty(0, 'fb')).toBe(0);
    });

    it('returns 0 for the first goal conceded (free goal)', () => {
        expect(calculateGoalsConcededPenalty(1, 'gk')).toBe(0);
        expect(calculateGoalsConcededPenalty(1, 'cb')).toBe(0);
        expect(calculateGoalsConcededPenalty(1, 'fb')).toBe(0);
    });

    it('returns -1 for 2 goals conceded', () => {
        expect(calculateGoalsConcededPenalty(2, 'gk')).toBe(-1);
        expect(calculateGoalsConcededPenalty(2, 'cb')).toBe(-1);
        expect(calculateGoalsConcededPenalty(2, 'fb')).toBe(-1);
    });

    it('returns -2 for 3 goals conceded', () => {
        expect(calculateGoalsConcededPenalty(3, 'gk')).toBe(-2);
    });

    it('returns -4 for 5 goals conceded', () => {
        expect(calculateGoalsConcededPenalty(5, 'gk')).toBe(-4);
    });

    it('returns 0 for positions that do not have a goals conceded rule (mid, wa, ca)', () => {
        expect(calculateGoalsConcededPenalty(3, 'mid')).toBe(0);
        expect(calculateGoalsConcededPenalty(3, 'wa')).toBe(0);
        expect(calculateGoalsConcededPenalty(3, 'ca')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// calculateSavesBonus
// ---------------------------------------------------------------------------

describe('calculateSavesBonus', () => {
    // Rule: threshold = 2, ratio = 3 (1pt per 3 saves)
    // Saves ≤ threshold → 0pts
    // Points = floor(saves / ratio) — threshold is NOT subtracted before dividing

    it('returns 0 for saves at or below the threshold (0, 1, 2)', () => {
        expect(calculateSavesBonus(0, 'gk')).toBe(0);
        expect(calculateSavesBonus(1, 'gk')).toBe(0);
        expect(calculateSavesBonus(2, 'gk')).toBe(0);
    });

    it('returns 1pt for 3 saves (floor(3/3) = 1)', () => {
        expect(calculateSavesBonus(3, 'gk')).toBe(1);
    });

    it('returns 1pt for 5 saves (floor(5/3) = 1)', () => {
        expect(calculateSavesBonus(5, 'gk')).toBe(1);
    });

    it('returns 2pts for 6 saves (floor(6/3) = 2)', () => {
        expect(calculateSavesBonus(6, 'gk')).toBe(2);
    });

    it('returns 3pts for 9 saves (floor(9/3) = 3)', () => {
        expect(calculateSavesBonus(9, 'gk')).toBe(3);
    });

    it('returns 0 for non-goalkeeper positions regardless of saves', () => {
        expect(calculateSavesBonus(10, 'cb')).toBe(0);
        expect(calculateSavesBonus(10, 'mid')).toBe(0);
        expect(calculateSavesBonus(10, 'ca')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// calculateBonus
// ---------------------------------------------------------------------------

describe('calculateBonus', () => {
    // Rule: cb and mid only. rule.bonus = 1 (the minimum threshold, not a multiplier).
    // Returns the raw bonus stat value when stat >= threshold, otherwise 0.
    // i.e. bonus stat IS the points value (1 BPS point = 1 app point)

    it('returns 0 for positions with no bonus rule (gk, fb, wa, ca)', () => {
        expect(calculateBonus(10, 'gk')).toBe(0);
        expect(calculateBonus(10, 'fb')).toBe(0);
        expect(calculateBonus(10, 'wa')).toBe(0);
        expect(calculateBonus(10, 'ca')).toBe(0);
    });

    it('returns 0 when bonus stat is below threshold (< 1)', () => {
        expect(calculateBonus(0, 'cb')).toBe(0);
        expect(calculateBonus(0, 'mid')).toBe(0);
    });

    it('returns the raw stat value when bonus stat meets the threshold', () => {
        expect(calculateBonus(1, 'cb')).toBe(1);
        expect(calculateBonus(1, 'mid')).toBe(1);
    });

    it('returns the raw stat value for higher bonus values (stat = points)', () => {
        expect(calculateBonus(3, 'cb')).toBe(3);
        expect(calculateBonus(5, 'mid')).toBe(5);
    });
});

// ===========================================================================
// What a player scores for a match
// ===========================================================================
//
// These are the tests that matter most: calculateGameweekPoints and
// calculateSeasonPoints are what produce every number a manager sees, on every page.
//
// They are written at the consumer boundary on purpose. Each one starts from
// FPL-shaped gameweek data -- the same shape the live API returns -- runs it through
// the real conversion and the real POSITION_RULES, and asserts the points that come
// out. Nothing here reaches into how the total is assembled, so the internals can be
// split, renamed or moved and these tests still hold. If one of them fails, the app's
// scoring genuinely changed.
//
// Expected values are worked out from rules.ts by hand and shown in the comments, so a
// failure tells you which rule broke rather than just which number moved.

const NOTHING_HAPPENED: FplPlayerGameweekData = {
    element: 1,
    fixture: 1,
    opponent_team: 2,
    total_points: 0,
    was_home: true,
    kickoff_time: '2026-08-15T14:00:00Z',
    team_h_score: 0,
    team_a_score: 0,
    round: 1,
    minutes: 0,
    goals_scored: 0,
    assists: 0,
    clean_sheets: 0,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 0,
    red_cards: 0,
    saves: 0,
    bonus: 0,
    clearances_blocks_interceptions: 0,
    tackles: 0,
    recoveries: 0,
    defensive_contribution: 0,
    bps: 0,
    // Not used by scoring, but present on every real FPL response.
    influence: '0.0',
    creativity: '0.0',
    threat: '0.0',
    ict_index: '0.0',
    starts: 0,
    expected_goals: '0.00',
    expected_assists: '0.00',
    expected_goal_involvements: '0.00',
    expected_goals_conceded: '0.00',
};

/** A gameweek as FPL reports it, with only the stats a test cares about set. */
const playedMatch = (stats: Partial<FplPlayerGameweekData>) => ({ ...NOTHING_HAPPENED, ...stats });

/** Points for one match, through the same path every caller uses. */
const pointsFor = (position: CustomPosition, ...matches: Partial<FplPlayerGameweekData>[]) =>
    calculateGameweekPoints(
        matches.map((m) => convertToPlayerGameweekStats(playedMatch(m))),
        position,
    );

describe('points for a single match', () => {
    // 90 min = 3, goal = 8, clean sheet = 5, bonus 3 (>= the cb threshold of 1) = 3,
    // CBIT 6+4 = 10, which meets the defender threshold of 10 = 1. Nothing conceded, so
    // no concession penalty. Total 20.
    it('scores a centre back who played, scored and kept a clean sheet', () => {
        const points = pointsFor('cb', {
            minutes: 90,
            goals_scored: 1,
            clean_sheets: 1,
            bonus: 3,
            clearances_blocks_interceptions: 6,
            tackles: 4,
        });

        expect(points.appearance).toBe(3);
        expect(points.goals).toBe(8);
        expect(points.cleanSheets).toBe(5);
        expect(points.bonus).toBe(3);
        expect(points.defensiveContribution).toBe(1);
        expect(points.goalsConceded).toBe(0);
        expect(points.total).toBe(20);
    });

    // 90 min = 3, conceded 2 = (2 x -1) + 1 = -1 (the first goal is free), 5 saves is
    // above the threshold of 2 so floor(5/3) = 1, penalty saved = 5. A keeper has no
    // bonus or defensive-contribution rule, so those stay 0. Total 8.
    it('scores a goalkeeper who conceded, made saves and saved a penalty', () => {
        const points = pointsFor('gk', {
            minutes: 90,
            goals_conceded: 2,
            saves: 5,
            penalties_saved: 1,
            bonus: 3,
            clearances_blocks_interceptions: 20,
            tackles: 20,
        });

        expect(points.appearance).toBe(3);
        expect(points.goalsConceded).toBe(-1);
        expect(points.saves).toBe(1);
        expect(points.penaltiesSaved).toBe(5);
        expect(points.bonus).toBe(0);
        expect(points.defensiveContribution).toBe(0);
        expect(points.total).toBe(8);
    });

    // 30 min = 1 (under 45), goal = 4, assist = 3, yellow = -1. A wide attacker gets
    // nothing for a clean sheet and is not penalised for goals conceded. Total 7.
    it('scores a wide attacker who came off the bench and was booked', () => {
        const points = pointsFor('wa', {
            minutes: 30,
            goals_scored: 1,
            assists: 1,
            yellow_cards: 1,
            clean_sheets: 1,
            goals_conceded: 2,
        });

        expect(points.appearance).toBe(1);
        expect(points.goals).toBe(4);
        expect(points.assists).toBe(3);
        expect(points.yellowCards).toBe(-1);
        expect(points.cleanSheets).toBe(0);
        expect(points.goalsConceded).toBe(0);
        expect(points.total).toBe(7);
    });

    // A red card costs a midfielder -5 but a defender only -3: the same offence is
    // punished differently by position, which is easy to break and invisible if it does.
    it('punishes a red card by position', () => {
        expect(pointsFor('mid', { minutes: 40, red_cards: 1 }).total).toBe(1 - 5);
        expect(pointsFor('cb', { minutes: 40, red_cards: 1 }).total).toBe(1 - 3);
    });

    // Counter-case: an unused substitute scores nothing at all, not even an appearance.
    it('gives an unused substitute nothing', () => {
        expect(pointsFor('mid', { minutes: 0 }).total).toBe(0);
    });
});

describe('points over a whole season', () => {
    const HAT_TRICK = { minutes: 90, goals_scored: 3, bonus: 3 };
    const QUIET_GAME = { minutes: 90, yellow_cards: 1 };
    const CAME_ON_LATE = { minutes: 20, assists: 1 };

    // The property that matters: a season is the sum of its gameweeks. If these ever
    // disagree, a manager's season total stops matching the gameweeks it is made of --
    // which is exactly the kind of drift nobody notices until the table looks wrong.
    it('totals the same as adding the gameweeks up one at a time', () => {
        const season = calculateSeasonPoints(
            [HAT_TRICK, QUIET_GAME, CAME_ON_LATE].map((m) => convertToPlayerGameweekStats(playedMatch(m))),
            'mid',
        );

        const addedUp =
            pointsFor('mid', HAT_TRICK).total +
            pointsFor('mid', QUIET_GAME).total +
            pointsFor('mid', CAME_ON_LATE).total;

        expect(season.points.total).toBe(addedUp);
    });

    it('matches calculating the same gameweeks in one go', () => {
        const matches = [HAT_TRICK, QUIET_GAME, CAME_ON_LATE].map((m) => convertToPlayerGameweekStats(playedMatch(m)));

        expect(calculateSeasonPoints(matches, 'mid').points.total).toBe(calculateGameweekPoints(matches, 'mid').total);
    });

    // A season with no matches is worth nothing, rather than throwing or producing NaN.
    it('gives a player who never played a total of zero', () => {
        expect(calculateSeasonPoints([], 'ca').points.total).toBe(0);
    });
});

describe('the total always equals its parts', () => {
    // `total` is stored alongside the breakdown rather than derived on read, so the two
    // can drift. Every points figure in the app is built from this pair.
    const SCENARIOS: [CustomPosition, Partial<FplPlayerGameweekData>][] = [
        ['gk', { minutes: 90, saves: 7, goals_conceded: 3, penalties_saved: 1 }],
        ['cb', { minutes: 90, clean_sheets: 1, bonus: 2, clearances_blocks_interceptions: 8, tackles: 5 }],
        ['fb', { minutes: 60, goals_scored: 1, goals_conceded: 1, yellow_cards: 1 }],
        ['mid', { minutes: 90, assists: 2, clearances_blocks_interceptions: 7, tackles: 4, recoveries: 3 }],
        ['wa', { minutes: 90, goals_scored: 2, red_cards: 1 }],
        ['ca', { minutes: 15, assists: 1 }],
    ];

    it.each(SCENARIOS)('holds for a %s', (position, match) => {
        const points = pointsFor(position, match);

        const sumOfParts = Object.entries(points)
            .filter(([key]) => key !== 'total')
            .reduce((sum, [, value]) => sum + value, 0);

        expect(points.total).toBe(sumOfParts);
    });
});

describe('the breakdown shown on a player page', () => {
    const MATCH = { minutes: 90, goals_scored: 1, assists: 1, clean_sheets: 1, bonus: 2 };

    // getFullBreakdown drives the per-stat rows on the player page. It is handed the
    // points it should explain, so the row totals must match those points -- otherwise
    // the page shows a breakdown that does not add up to the number beside it.
    it('reports the same points it was given', () => {
        const stats = [convertToPlayerGameweekStats(playedMatch(MATCH))];
        const season = calculateSeasonPoints(stats, 'cb');

        const breakdown = getFullBreakdown(stats, 'cb', season);

        expect(breakdown.goals.points).toBe(season.points.goals);
        expect(breakdown.assists.points).toBe(season.points.assists);
        expect(breakdown.cleanSheets.points).toBe(season.points.cleanSheets);
        expect(breakdown.appearance.points).toBe(season.points.appearance);
    });

    it('reports the underlying stat next to the points', () => {
        const stats = [convertToPlayerGameweekStats(playedMatch(MATCH))];
        const season = calculateSeasonPoints(stats, 'cb');

        const breakdown = getFullBreakdown(stats, 'cb', season);

        expect(breakdown.goals.stat).toBe(1);
        expect(breakdown.assists.stat).toBe(1);
    });
});
