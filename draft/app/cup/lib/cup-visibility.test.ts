/* Location: app/cup/lib/cup-visibility.test.ts */

import { describe, expect, it } from 'vitest';
import { getTeamVisibility, isRevealed } from './cup-visibility';

describe('cup team visibility', () => {
    it('is not_submitted when there is no team on record', () => {
        expect(getTeamVisibility({ hasSubmission: false, deadlinePassed: true, subsConfirmed: true })).toBe(
            'not_submitted',
        );
    });

    it('stays hidden after the deadline while subs are unconfirmed', () => {
        expect(getTeamVisibility({ hasSubmission: true, deadlinePassed: true, subsConfirmed: false })).toBe(
            'submitted_hidden',
        );
    });

    it('stays hidden before the deadline even when subs are confirmed', () => {
        expect(getTeamVisibility({ hasSubmission: true, deadlinePassed: false, subsConfirmed: true })).toBe(
            'submitted_hidden',
        );
    });

    it('reveals only once the deadline has passed AND subs are confirmed', () => {
        const visibility = getTeamVisibility({ hasSubmission: true, deadlinePassed: true, subsConfirmed: true });
        expect(visibility).toBe('revealed');
        expect(isRevealed(visibility)).toBe(true);
    });
});
