/* Location: app/_shared/lib/league-divisions.test.ts */

import { describe, expect, it } from 'vitest';
import type { DivisionSheetData } from '../types/league-types';
import {
    cupDivisions,
    cupEligibleManagers,
    describeUnknownDivisions,
    KNOWN_DIVISION_IDS,
    unknownDivisionIds,
} from './league-divisions';

/**
 * `DivisionId` is a compile-time union and says nothing about a spreadsheet someone edited
 * this morning. This is the runtime half, written after the two drifted: a fourth division
 * appeared in the sheet and the app's entire reaction was
 * `Cannot read properties of undefined (reading 'push')` on the admin page.
 *
 * That division — `greatScott` — is now supported, so the unknown-division cases below use
 * an invented id instead. What each division *takes part in* is a separate question, and
 * it comes from the sheet rather than from the id or from its rank.
 */

const division = (id: string, rules: Partial<DivisionSheetData> = {}): DivisionSheetData =>
    ({
        id,
        label: id,
        order: 1,
        promotion: false,
        relegation: false,
        cup: false,
        ...rules,
    }) as DivisionSheetData;

const PYRAMID = [
    division('premierLeague', { order: 1, relegation: true, cup: true }),
    division('championship', { order: 2, promotion: true, relegation: true, cup: true }),
    division('leagueOne', { order: 3, promotion: true, cup: true }),
];
const GREAT_SCOTT = division('greatScott', { order: 4 });
const ALL_DIVISIONS = [...PYRAMID, GREAT_SCOTT];

describe('spotting a division the app does not know', () => {
    it('finds an id with no DivisionId', () => {
        expect(unknownDivisionIds([...KNOWN_DIVISION_IDS, 'zulu'])).toEqual(['zulu']);
    });

    it('accepts every division the app now supports, greatScott included', () => {
        expect(unknownDivisionIds([...KNOWN_DIVISION_IDS])).toEqual([]);
        expect(unknownDivisionIds(['greatScott'])).toEqual([]);
    });

    it('ignores blanks and whitespace, which a spreadsheet is full of', () => {
        expect(unknownDivisionIds(['premierLeague', '', '   ', null, undefined])).toEqual([]);
    });

    it('reports each unknown division once, in a stable order', () => {
        expect(unknownDivisionIds(['zulu', 'alpha', 'zulu'])).toEqual(['alpha', 'zulu']);
    });

    it('trims, so a stray space is not reported as a different division', () => {
        expect(unknownDivisionIds([' premierLeague '])).toEqual([]);
    });
});

describe('the sentence it produces', () => {
    it('is null when every division is recognised', () => {
        expect(describeUnknownDivisions([...KNOWN_DIVISION_IDS])).toBeNull();
    });

    it('names the offending division', () => {
        expect(describeUnknownDivisions(['zulu'])).toContain('zulu');
    });

    it('says what the app does support, so the reader can see the gap', () => {
        const message = describeUnknownDivisions(['zulu']) ?? '';

        for (const known of KNOWN_DIVISION_IDS) {
            expect(message).toContain(known);
        }
    });

    it('makes clear this needs a code change, not a sheet correction', () => {
        // Otherwise the obvious reading is "I typed the division wrong", and someone
        // deletes real data trying to fix it.
        expect(describeUnknownDivisions(['zulu'])).toMatch(/code change/i);
    });

    it('says the data is ignored rather than implying it was loaded', () => {
        expect(describeUnknownDivisions(['zulu'])).toMatch(/ignored/i);
    });

    it('pluralises when there is more than one', () => {
        expect(describeUnknownDivisions(['zulu', 'alpha'])).toMatch(/divisions this app does not recognise/);
    });
});

describe('which divisions play in the cup', () => {
    it('takes it from the sheet, not from the division list', () => {
        expect(cupDivisions(ALL_DIVISIONS).map((d) => d.id)).toEqual(['premierLeague', 'championship', 'leagueOne']);
    });

    it('excludes a division whose cup flag is off', () => {
        expect(cupDivisions(ALL_DIVISIONS).map((d) => d.id)).not.toContain('greatScott');
    });
});

describe('who is eligible for the cup', () => {
    const managers = [
        { userId: 'ann', divisionId: 'premierLeague' as const },
        { userId: 'bob', divisionId: 'leagueOne' as const },
        { userId: 'cat', divisionId: 'greatScott' as const },
    ];

    it('leaves out managers from a division that does not play', () => {
        // The silent one: nothing crashes, the cup standings just contain people who
        // should not be ranked for the 16 qualifying places.
        expect(cupEligibleManagers(managers, ALL_DIVISIONS).map((m) => m.userId)).toEqual(['ann', 'bob']);
    });

    it('keeps everyone from divisions that do play', () => {
        expect(cupEligibleManagers(managers, PYRAMID).map((m) => m.userId)).toEqual(['ann', 'bob']);
    });

    it('falls back to including everyone when no division has any rules yet', () => {
        // An unconfigured sheet should not silently empty the cup; that fails worse and
        // less visibly than including too many.
        const unconfigured = ALL_DIVISIONS.map((d) => ({ ...d, cup: false }));

        expect(cupEligibleManagers(managers, unconfigured)).toHaveLength(3);
    });
});
