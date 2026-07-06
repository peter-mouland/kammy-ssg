/* Location: app/cup/lib/cup-rules.test.ts */

import { describe, expect, it } from 'vitest';
import {
    CUP_STAGES,
    findReusedPlayers,
    getStageShape,
    hasReusedPlayer,
    isDisqualified,
    isKnockoutStage,
    MAX_AUTOPICKS_BEFORE_DQ,
    QUALIFYING_PLACES,
} from './cup-rules';

describe('cup stage shapes', () => {
    it('requires 4 players in every stage except the 6-player final', () => {
        expect(getStageShape('league').playersRequired).toBe(4);
        expect(getStageShape('r16').playersRequired).toBe(4);
        expect(getStageShape('qf').playersRequired).toBe(4);
        expect(getStageShape('sf').playersRequired).toBe(4);
        expect(getStageShape('final').playersRequired).toBe(6);
    });

    it('marks only the middle rounds as two-legged', () => {
        expect(CUP_STAGES.league.twoLegged).toBe(false);
        expect(CUP_STAGES.r16.twoLegged).toBe(true);
        expect(CUP_STAGES.qf.twoLegged).toBe(true);
        expect(CUP_STAGES.sf.twoLegged).toBe(true);
        expect(CUP_STAGES.final.twoLegged).toBe(false);
    });

    it('treats r16/qf/sf/final as knockout and the league stage as not', () => {
        expect(isKnockoutStage('league')).toBe(false);
        expect(isKnockoutStage('r16')).toBe(true);
        expect(isKnockoutStage('final')).toBe(true);
    });

    it('qualifies 16 managers from the league stage', () => {
        expect(QUALIFYING_PLACES).toBe(16);
    });
});

describe('player-reuse ban within a round', () => {
    it('reports players reused from the other leg', () => {
        expect(findReusedPlayers([1, 2, 3, 4], [3, 9])).toEqual([3]);
        expect(hasReusedPlayer([1, 2, 3, 4], [3, 9])).toBe(true);
    });

    it('allows a completely fresh selection', () => {
        expect(findReusedPlayers([1, 2, 3, 4], [5, 6, 7, 8])).toEqual([]);
        expect(hasReusedPlayer([1, 2, 3, 4], [5, 6, 7, 8])).toBe(false);
    });

    it('treats an empty other leg as no reuse', () => {
        expect(hasReusedPlayer([1, 2, 3, 4], [])).toBe(false);
    });
});

describe('disqualification', () => {
    it('disqualifies at the autopick limit', () => {
        expect(isDisqualified(MAX_AUTOPICKS_BEFORE_DQ)).toBe(true);
        expect(isDisqualified(MAX_AUTOPICKS_BEFORE_DQ + 1)).toBe(true);
    });

    it('does not disqualify below the limit', () => {
        expect(isDisqualified(0)).toBe(false);
        expect(isDisqualified(1)).toBe(false);
    });
});
