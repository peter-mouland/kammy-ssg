/* Location: app/leagues/lib/gameweek-range.test.ts */

import { describe, expect, it } from 'vitest';
import { formatGameweekRange, gameweekScoringWindows, parseGameweekRange } from './gameweek-range';

const CURRENT_GAMEWEEK = 21;
const parse = (search: string) => parseGameweekRange(new URLSearchParams(search), CURRENT_GAMEWEEK);

describe('which URLs ask for a range', () => {
    it('reads from and to', () => {
        expect(parse('?from=5&to=8')).toEqual({ from: 5, to: 8 });
    });

    it('allows a range that ends at the gameweek being played', () => {
        expect(parse('?from=18&to=21')).toEqual({ from: 18, to: 21 });
    });

    it('allows a single week', () => {
        expect(parse('?from=5&to=5')).toEqual({ from: 5, to: 5 });
    });

    it('swaps ends given the wrong way round', () => {
        expect(parse('?from=8&to=5')).toEqual({ from: 5, to: 8 });
    });
});

describe('which URLs show the normal page instead', () => {
    it.each([
        ['no range at all', ''],
        ['only one end', '?from=5'],
        ['a gameweek that has not been played', '?from=5&to=22'],
        ['gameweek zero', '?from=0&to=3'],
        ['not a number', '?from=five&to=8'],
        ['a partial number', '?from=5abc&to=8'],
    ])('%s', (_, search) => {
        expect(parse(search)).toBeNull();
    });
});

describe('the range title', () => {
    it('names both ends', () => {
        expect(formatGameweekRange({ from: 5, to: 8 })).toBe('Gameweeks 5-8');
    });

    it('reads as one gameweek when it is one', () => {
        expect(formatGameweekRange({ from: 5, to: 5 })).toBe('Gameweek 5');
    });
});

describe('when each gameweek in a range was scored', () => {
    const event = (id: number, deadline: string) => ({ fplEvent: { id, deadline_time: deadline } });
    const EVENTS = [
        event(1, '2024-08-16T17:30:00Z'),
        event(2, '2024-08-24T10:00:00Z'),
        event(3, '2024-08-31T10:00:00Z'),
        event(4, '2024-09-14T10:00:00Z'),
    ];

    // GW3's deadline is 31 August, but its points ran to 14 September: that is what puts it
    // in a September prize rather than August, and why the picking window is the wrong one.
    it('runs from each gameweek’s deadline to the next one', () => {
        expect(gameweekScoringWindows({ from: 2, to: 3 }, EVENTS)).toEqual([
            { gameweek: 2, from: '2024-08-24T10:00:00.000Z', to: '2024-08-31T10:00:00.000Z' },
            { gameweek: 3, from: '2024-08-31T10:00:00.000Z', to: '2024-09-14T10:00:00.000Z' },
        ]);
    });

    it('leaves the end open for a gameweek with no next deadline', () => {
        expect(gameweekScoringWindows({ from: 4, to: 4 }, EVENTS)).toEqual([
            { gameweek: 4, from: '2024-09-14T10:00:00.000Z', to: null },
        ]);
    });

    it('accepts deadlines as dates, as the stored calendar sometimes has them', () => {
        const windows = gameweekScoringWindows({ from: 1, to: 1 }, [
            { fplEvent: { id: 1, deadline_time: new Date('2024-08-16T17:30:00Z') } },
            { fplEvent: { id: 2, deadline_time: new Date('2024-08-24T10:00:00Z') } },
        ]);

        expect(windows[0]).toEqual({ gameweek: 1, from: '2024-08-16T17:30:00.000Z', to: '2024-08-24T10:00:00.000Z' });
    });

    it('skips a gameweek missing from the calendar rather than inventing dates', () => {
        expect(gameweekScoringWindows({ from: 4, to: 5 }, EVENTS).map((w) => w.gameweek)).toEqual([4]);
    });
});
