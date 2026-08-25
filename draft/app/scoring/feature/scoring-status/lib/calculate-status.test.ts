/* Location: app/scoring/feature/scoring-status/lib/calculate-status.test.ts */

import { describe, expect, it } from 'vitest';
import type { ScoringStatusInput } from '../types';
import { calculateScoringStatus } from './calculate-status';

/**
 * The badge is the only prompt an admin gets that points need re-running -- nothing else
 * tells them. So the case that matters is not "does it go green when everything is done",
 * it is "does it refuse to go green while there is something outstanding".
 *
 * Everything it reasons about comes from the FPL fixtures, which are fetched live. It
 * deliberately does NOT take the gameweek's own `finished` flag: that lives on the stored
 * events document, which only changes when an admin repopulates bootstrap data, so it can
 * still read `false` days after a gameweek ended -- or `true` off a stale populate.
 */

// After the 11:00 kickoff has settled, so the default fixture below is a match this run
// has fully seen. Tests that want an unsettled one move the kickoff, not this.
const GENERATED = '2025-01-11T14:00:00Z';

type Fixture = ScoringStatusInput['fixtures'][number];

const fixture = (over: Partial<Fixture> = {}): Fixture => ({
    event: 1,
    started: true,
    finished: true,
    kickoff_time: '2025-01-11T11:00:00Z',
    ...over,
});

const statusOf = (fixtures: Fixture[], lastGenerated: string | null = GENERATED) =>
    calculateScoringStatus({ lastGenerated, currentGameweekNumber: 1, fixtures }).status;

describe('scoring status', () => {
    it('is up to date once every match in the gameweek is finished', () => {
        expect(statusOf([fixture(), fixture()])).toBe('up-to-date');
    });

    it('is stale when a match kicked off after the last generation', () => {
        expect(statusOf([fixture(), fixture({ kickoff_time: '2025-01-11T16:00:00Z' })])).toBe('stale');
    });

    it('is stale while a match is in play, even one that kicked off before the last run', () => {
        // The hole this closes: points move for 90 minutes after kickoff, so a run made
        // during the match is out of date the moment anyone scores.
        expect(statusOf([fixture({ started: true, finished: false, kickoff_time: '2025-01-11T11:00:00Z' })])).toBe(
            'stale',
        );
    });

    it('is pending before any of the gameweek’s matches have started', () => {
        expect(statusOf([fixture({ started: false, finished: false })])).toBe('pending');
    });

    it('is pending when some matches are done and the rest have not kicked off', () => {
        expect(statusOf([fixture(), fixture({ started: false, finished: false })])).toBe('pending');
    });

    it('ignores other gameweeks entirely', () => {
        // A GW2 match kicking off says nothing about whether GW1's points are current.
        expect(statusOf([fixture(), fixture({ event: 2, started: true, kickoff_time: '2025-01-11T16:00:00Z' })])).toBe(
            'up-to-date',
        );
    });

    it('is pending when the gameweek has no fixtures at all, not up to date', () => {
        // No fixtures is not the same as every fixture being finished. Calling it green
        // would tell an admin there is nothing to do on a gameweek nobody has loaded.
        expect(statusOf([])).toBe('pending');
    });

    it('is stale when the last run happened while the final match was still being played', () => {
        // The transition #128 left open. The badge correctly turns red while the match
        // plays, then goes green the instant it is marked finished -- although the run at
        // 17:00 never saw the result, let alone the bonus. Kickoff is the wrong anchor:
        // what matters is whether the match had SETTLED by the time points were generated.
        const status = statusOf(
            [fixture({ kickoff_time: '2025-01-11T14:00:00Z' }), fixture({ kickoff_time: '2025-01-11T16:30:00Z' })],
            '2025-01-11T17:00:00Z',
        );

        expect(status).toBe('stale');
    });

    it('is up to date once the last match has settled and points were generated after it', () => {
        // The other side of the same line: a run late enough to have seen everything.
        expect(statusOf([fixture({ kickoff_time: '2025-01-11T16:30:00Z' })], '2025-01-11T21:00:00Z')).toBe(
            'up-to-date',
        );
    });

    it('is stale when points have never been generated and a match has started', () => {
        expect(statusOf([fixture()], null)).toBe('stale');
    });

    it('reports back the generation time it was given', () => {
        expect(calculateScoringStatus({ lastGenerated: GENERATED, currentGameweekNumber: 1, fixtures: [] })).toEqual({
            status: 'pending',
            lastGenerated: GENERATED,
        });
    });
});
