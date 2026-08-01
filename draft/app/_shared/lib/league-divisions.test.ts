/* Location: app/_shared/lib/league-divisions.test.ts */

import { describe, expect, it } from 'vitest';
import { describeUnknownDivisions, KNOWN_DIVISION_IDS, unknownDivisionIds } from './league-divisions';

/**
 * `DivisionId` is a compile-time union and says nothing about a spreadsheet someone edited
 * this morning. This is the runtime half, written after the two drifted: a fourth division
 * (`greatScott`) appeared in the sheet and the app's entire reaction was
 * `Cannot read properties of undefined (reading 'push')` on the admin page.
 */

describe('spotting a division the app does not know', () => {
    it('finds the one that broke /admin', () => {
        expect(unknownDivisionIds(['premierLeague', 'championship', 'leagueOne', 'greatScott'])).toEqual([
            'greatScott',
        ]);
    });

    it('finds nothing when the sheet matches the app', () => {
        expect(unknownDivisionIds([...KNOWN_DIVISION_IDS])).toEqual([]);
    });

    it('ignores blanks and whitespace, which a spreadsheet is full of', () => {
        expect(unknownDivisionIds(['premierLeague', '', '   ', null, undefined])).toEqual([]);
    });

    it('reports each unknown division once, in a stable order', () => {
        expect(unknownDivisionIds(['zulu', 'greatScott', 'zulu'])).toEqual(['greatScott', 'zulu']);
    });

    it('trims, so a stray space is not reported as a different division', () => {
        expect(unknownDivisionIds([' premierLeague '])).toEqual([]);
    });
});

describe('the sentence it produces', () => {
    it('is null when there is nothing to say', () => {
        expect(describeUnknownDivisions([...KNOWN_DIVISION_IDS])).toBeNull();
    });

    it('names the offending division', () => {
        expect(describeUnknownDivisions(['greatScott'])).toContain('greatScott');
    });

    it('says what the app does support, so the reader can see the gap', () => {
        const message = describeUnknownDivisions(['greatScott']) ?? '';

        for (const known of KNOWN_DIVISION_IDS) {
            expect(message).toContain(known);
        }
    });

    it('makes clear this needs a code change, not a sheet correction', () => {
        // Otherwise the obvious reading is "I typed the division wrong", and someone
        // deletes real data trying to fix it.
        expect(describeUnknownDivisions(['greatScott'])).toMatch(/code change/i);
    });

    it('says the data is ignored rather than implying it was loaded', () => {
        expect(describeUnknownDivisions(['greatScott'])).toMatch(/ignored/i);
    });

    it('pluralises when there is more than one', () => {
        expect(describeUnknownDivisions(['greatScott', 'zulu'])).toMatch(/divisions this app does not recognise/);
    });
});
