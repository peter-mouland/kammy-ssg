/* Location: app/transfers/lib/player-modal-param.test.ts */

import { describe, expect, it } from 'vitest';
import { onlyPlayerModalChanged } from './player-modal-param';

const url = (pathAndSearch: string) => new URL(`http://localhost${pathAndSearch}`);

describe('whether a move only opened or closed the player modal', () => {
    it('is true for opening, closing or switching the player', () => {
        expect(onlyPlayerModalChanged(url('/transfers?userId=Nick'), url('/transfers?userId=Nick&player=7'))).toBe(
            true,
        );
        expect(onlyPlayerModalChanged(url('/transfers?player=7&userId=Nick'), url('/transfers?userId=Nick'))).toBe(
            true,
        );
        expect(onlyPlayerModalChanged(url('/transfers?player=7'), url('/transfers?player=9'))).toBe(true);
    });

    it('ignores the order of the other params', () => {
        expect(onlyPlayerModalChanged(url('/transfers?a=1&b=2'), url('/transfers?b=2&player=7&a=1'))).toBe(true);
    });

    it('is false when anything the loader reads changes too', () => {
        expect(onlyPlayerModalChanged(url('/transfers?gameweek=12'), url('/transfers?gameweek=13&player=7'))).toBe(
            false,
        );
        expect(onlyPlayerModalChanged(url('/transfers?userId=Nick'), url('/transfers?userId=Sav'))).toBe(false);
    });

    it('is false for a different page', () => {
        expect(onlyPlayerModalChanged(url('/transfers'), url('/transfers/championship?player=7'))).toBe(false);
    });
});
