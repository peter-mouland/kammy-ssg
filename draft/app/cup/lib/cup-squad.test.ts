/* Location: app/cup/lib/cup-squad.test.ts */

import { describe, expect, it } from 'vitest';
import { makeStandardRoster } from '../../transfers/lib/validators/fixtures';
import { getCupSquad } from './cup-squad';

describe('getCupSquad', () => {
    it('returns the 12 selectable squad players and excludes the on-loan slot', () => {
        const squad = getCupSquad(makeStandardRoster());
        expect(squad).toHaveLength(12);
        // on_loan_0 placeholder (code 0) is never selectable
        expect(squad.map((p) => p.code)).not.toContain(0);
    });

    it('flags the bench player as a sub', () => {
        const squad = getCupSquad(makeStandardRoster());
        const sub = squad.find((p) => p.code === 112);
        expect(sub?.isSub).toBe(true);
    });

    it('marks players that are only in the squad via a pending sub', () => {
        const squad = getCupSquad(makeStandardRoster(), new Set([106]));
        expect(squad.find((p) => p.code === 106)?.isPending).toBe(true);
        expect(squad.find((p) => p.code === 107)?.isPending).toBe(false);
    });
});
