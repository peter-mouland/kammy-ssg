/* Location: app/admin/lib/transfers-gameweek.test.ts */

import { afterEach, describe, expect, it } from 'vitest';
import { setNow } from '../../_shared/lib/clock';
import { fplBootstrap } from '../../_shared/test/fixtures/season-fixtures';
import type { EventData } from '../../_shared/lib/fpl/fpl-types';
import { findScoringGameweek, findSelectionGameweek, getGameweekData } from '../../_shared/lib/fpl/gameweeks';
import {
    resolveTransfersAdminSelectedGameweekId,
    transfersAdminAvailableGameweeks,
    transfersAdminSelectionGameweek,
} from './transfers-gameweek';

/**
 * Admin transfer review must default to the selection gameweek — the round managers are
 * submitting for — not the scoring gameweek. Mid-window after a deadline those differ, and
 * that was the bug: reviewers landed on the played GW and could not navigate to the next.
 */

const events = fplBootstrap().events as EventData[];

/** Just after GW1’s deadline: scoring GW1, selection GW2. */
const MID_WINDOW = '2024-08-16T18:00:00Z';

afterEach(() => setNow(null));

describe('admin transfers gameweek focus', () => {
    it('defaults to the selection gameweek when scoring and selection differ', () => {
        setNow(MID_WINDOW);
        const gameweeks = getGameweekData(events, new Date(MID_WINDOW));

        expect(findScoringGameweek(gameweeks, new Date(MID_WINDOW))?.fplEvent.id).toBe(1);
        expect(findSelectionGameweek(gameweeks, new Date(MID_WINDOW))?.fplEvent.id).toBe(2);

        expect(resolveTransfersAdminSelectedGameweekId(gameweeks, null)).toBe(2);
        expect(transfersAdminSelectionGameweek(gameweeks)?.fplEvent.id).toBe(2);
    });

    it('honours ?gameweek= when reviewing a different round', () => {
        setNow(MID_WINDOW);
        const gameweeks = getGameweekData(events, new Date(MID_WINDOW));

        expect(resolveTransfersAdminSelectedGameweekId(gameweeks, '1')).toBe(1);
    });

    it('includes the selection gameweek in the selectable range when it is ahead of scoring', () => {
        setNow(MID_WINDOW);
        const gameweeks = getGameweekData(events, new Date(MID_WINDOW));

        expect(transfersAdminAvailableGameweeks(gameweeks)).toEqual([1, 2]);
    });

    it('has no default once the final deadline has passed', () => {
        const afterSeason = '2025-05-26T00:00:00Z';
        setNow(afterSeason);
        const gameweeks = getGameweekData(events, new Date(afterSeason));

        expect(resolveTransfersAdminSelectedGameweekId(gameweeks, null)).toBeUndefined();
        expect(transfersAdminSelectionGameweek(gameweeks)).toBeUndefined();
    });
});
