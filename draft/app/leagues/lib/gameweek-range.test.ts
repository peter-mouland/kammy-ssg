/* Location: app/leagues/lib/gameweek-range.test.ts */

import { describe, expect, it } from 'vitest';
import { formatGameweekRange, parseGameweekRange } from './gameweek-range';

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
