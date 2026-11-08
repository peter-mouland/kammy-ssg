/* Location: app/transfers/lib/group-roster-by-category.test.ts */

import { describe, expect, it } from 'vitest';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { RosterPlayer, TeamRoster } from '../../_shared/types/squad-types';
import { groupRosterByCategory, ON_LOAN_GROUP_KEY } from './group-roster-by-category';

const player = (code: number) => ({ code, web_name: `P${code}` }) as unknown as EnhancedPlayerData;
const slot = (code: number) => ({ player: { playerCode: code } as RosterPlayer });

const playersByCode = Object.fromEntries([1, 2, 3, 4, 5].map((code) => [code, player(code)]));

const codesByGroup = (roster: Partial<Record<string, ReturnType<typeof slot>>>) =>
    groupRosterByCategory(roster as unknown as TeamRoster, playersByCode, []).map((group) => [
        group.key,
        group.players.map((p) => p.code),
    ]);

describe('grouping a squad by scoring category', () => {
    it('follows league-table order and slot order, not the order the roster was stored in', () => {
        expect(codesByGroup({ ca_0: slot(5), sub_0: slot(2), cb_1: slot(4), gk_0: slot(1), cb_0: slot(3) })).toEqual([
            ['gk', [1, 2]],
            ['cb', [3, 4]],
            ['ca', [5]],
        ]);
    });

    it('puts players out on loan last, in a group of their own', () => {
        expect(codesByGroup({ on_loan_0: slot(2), gk_0: slot(1) })).toEqual([
            ['gk', [1]],
            [ON_LOAN_GROUP_KEY, [2]],
        ]);
    });

    it('drops a player it has no details for rather than showing an empty row', () => {
        expect(codesByGroup({ gk_0: slot(1), cb_0: slot(999) })).toEqual([['gk', [1]]]);
    });
});
