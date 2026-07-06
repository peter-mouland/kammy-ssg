/* Location: app/cup/lib/autopick.test.ts */

import { describe, expect, it } from 'vitest';
import { generateAutopick } from './autopick';
import type { CupSquadPlayer } from './cup-squad';

function player(code: number, name: string): CupSquadPlayer {
    return { code, name, position: 'mid', isSub: false, isPending: false };
}

const SQUAD: CupSquadPlayer[] = [player(1, 'Zidane'), player(2, 'Ada'), player(3, 'Charlie'), player(4, 'Beckham')];

describe('generateAutopick', () => {
    it('picks the required number of players alphabetically', () => {
        expect(generateAutopick(SQUAD, 2)).toEqual([2, 4]); // Ada, Beckham
    });

    it('excludes players already used in the other leg', () => {
        expect(generateAutopick(SQUAD, 2, [2])).toEqual([4, 3]); // skip Ada -> Beckham, Charlie
    });

    it('returns fewer than required when the squad is too small', () => {
        expect(generateAutopick(SQUAD, 10)).toHaveLength(4);
    });
});
