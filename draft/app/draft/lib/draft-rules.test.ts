/* Location: app/draft/lib/draft-rules.test.ts */

import { describe, expect, it } from 'vitest';
import type { CustomPosition } from '../../_shared/types/league-types';
import { DRAFT_RULES, getSquadComposition, validateDraftEligibility } from './draft-rules';

// A squad is 11 starters (1 gk, 2 each of cb/fb/mid/wa/ca) plus 1 substitute = 12.
// A manager may hold at most 2 players from any one real-world club.

/** One player a manager has already drafted. */
const drafted = (position: CustomPosition, teamName = 'Arsenal') => ({
    position,
    teamCode: teamName,
    teamName,
});

/** A player being considered. Target players carry their position under `draft`. */
const candidate = (position: CustomPosition, teamName = 'Arsenal') => ({
    draft: { position },
    team_code: teamName,
});

const squadOf = (...picks: ReturnType<typeof drafted>[]) => getSquadComposition(picks);

describe('getSquadComposition', () => {
    it('counts nothing for a manager who has not drafted', () => {
        const { positionCounts, teamCounts } = squadOf();

        expect(positionCounts.total).toBe(0);
        expect(positionCounts.sub).toBe(0);
        expect(teamCounts).toEqual({});
    });

    it('counts players into their own position', () => {
        const { positionCounts } = squadOf(drafted('gk'), drafted('cb'), drafted('cb'), drafted('mid'));

        expect(positionCounts.gk).toBe(1);
        expect(positionCounts.cb).toBe(2);
        expect(positionCounts.mid).toBe(1);
        expect(positionCounts.total).toBe(4);
    });

    // Overflow is the whole reason `sub` exists: a third midfielder is not a third
    // midfield slot, it is the squad's one substitute.
    it('puts a player beyond their position’s maximum into the substitute slot', () => {
        const { positionCounts } = squadOf(drafted('mid'), drafted('mid'), drafted('mid'));

        expect(positionCounts.mid).toBe(2); // the maximum
        expect(positionCounts.sub).toBe(1); // the third one
        expect(positionCounts.total).toBe(3);
    });

    // Goalkeeper is the only position with a maximum of 1, so it overflows soonest.
    it('overflows a second goalkeeper to the substitute slot', () => {
        const { positionCounts } = squadOf(drafted('gk'), drafted('gk'));

        expect(positionCounts.gk).toBe(1);
        expect(positionCounts.sub).toBe(1);
    });

    it('counts how many players come from each real-world club', () => {
        const { teamCounts } = squadOf(drafted('cb', 'Arsenal'), drafted('mid', 'Arsenal'), drafted('wa', 'Chelsea'));

        expect(teamCounts.Arsenal.count).toBe(2);
        expect(teamCounts.Chelsea.count).toBe(1);
    });
});

describe('validateDraftEligibility', () => {
    it('rejects when no player has been selected', () => {
        const result = validateDraftEligibility(squadOf(), null);

        expect(result.isEligible).toBe(false);
        expect(result.violations).toContain('No player selected');
    });

    it('accepts a player into an empty squad', () => {
        const result = validateDraftEligibility(squadOf(), candidate('mid'));

        expect(result.isEligible).toBe(true);
        expect(result.canAddToSub).toBe(false); // goes into a real position, not the bench
        expect(result.violations).toEqual([]);
    });

    // The club limit is a hard block: it cannot be worked around by using the bench.
    it('rejects a third player from the same club', () => {
        const squad = squadOf(drafted('cb', 'Arsenal'), drafted('mid', 'Arsenal'));

        const result = validateDraftEligibility(squad, candidate('wa', 'Arsenal'));

        expect(result.isEligible).toBe(false);
        expect(result.canAddToSub).toBe(false);
        expect(result.violations).toEqual(['Already have 2 players from Arsenal']);
    });

    it('accepts a second player from the same club', () => {
        const squad = squadOf(drafted('cb', 'Arsenal'));

        expect(validateDraftEligibility(squad, candidate('mid', 'Arsenal')).isEligible).toBe(true);
    });

    it('counts club players separately per club', () => {
        const squad = squadOf(drafted('cb', 'Arsenal'), drafted('mid', 'Arsenal'));

        expect(validateDraftEligibility(squad, candidate('wa', 'Chelsea')).isEligible).toBe(true);
    });

    // A full position does not end the matter -- the player can still be the sub.
    it('offers the bench when a position is already full', () => {
        const squad = squadOf(drafted('mid', 'Arsenal'), drafted('mid', 'Chelsea'));

        const result = validateDraftEligibility(squad, candidate('mid', 'Everton'));

        expect(result.isEligible).toBe(true);
        expect(result.canAddToSub).toBe(true);
        expect(result.violations).toContain('Already have 2 Midfielders');
    });

    // ...but there is only one bench slot, so the next one has nowhere to go.
    it('rejects a player when their position is full and the bench is taken', () => {
        const squad = squadOf(
            drafted('mid', 'Arsenal'),
            drafted('mid', 'Chelsea'),
            drafted('mid', 'Everton'), // this one became the substitute
        );

        const result = validateDraftEligibility(squad, candidate('mid', 'Fulham'));

        expect(result.isEligible).toBe(false);
        expect(result.canAddToSub).toBe(false);
    });

    // The bench is shared across the whole squad, not one slot per position.
    it('rejects a full position when the bench was filled by a different position', () => {
        const squad = squadOf(
            drafted('gk', 'Arsenal'),
            drafted('gk', 'Chelsea'), // second keeper takes the one bench slot
            drafted('wa', 'Everton'),
            drafted('wa', 'Fulham'),
        );

        const result = validateDraftEligibility(squad, candidate('wa', 'Leeds'));

        expect(result.isEligible).toBe(false);
    });

    it('rejects a player whose position we do not recognise', () => {
        const result = validateDraftEligibility(squadOf(), candidate('striker' as CustomPosition));

        expect(result.isEligible).toBe(false);
        expect(result.violations).toEqual(['Unknown position: striker']);
    });

    // Squad size is checked before anything else, so a full squad reports being full
    // rather than complaining about a position.
    it('rejects everyone once the squad is full', () => {
        const fullSquad = {
            positionCounts: { gk: 1, cb: 2, fb: 2, mid: 2, wa: 2, ca: 2, sub: 1, total: DRAFT_RULES.totalSquadSize },
            teamCounts: {},
        };

        const result = validateDraftEligibility(fullSquad, candidate('mid', 'Leeds'));

        expect(result.isEligible).toBe(false);
        expect(result.violations).toEqual(['Squad is full (12 players)']);
    });

    // The rules table and the squad size have to stay consistent: 11 starters + 1 sub.
    it('has position maximums that add up to the squad size', () => {
        const starters = Object.values(DRAFT_RULES.positions).reduce((sum, rule) => sum + rule.max, 0);

        expect(starters + DRAFT_RULES.maxSubstitutes).toBe(DRAFT_RULES.totalSquadSize);
    });
});
