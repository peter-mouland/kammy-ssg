/* Location: app/admin/lib/transfers-gameweek.test.ts */

import { afterEach, describe, expect, it } from 'vitest';
import { setNow } from '../../_shared/lib/clock';
import type { EventData } from '../../_shared/lib/fpl/fpl-types';
import { findScoringGameweek, findSelectionGameweek, getGameweekData } from '../../_shared/lib/fpl/gameweeks';
import { fplBootstrap } from '../../_shared/test/fixtures/season-fixtures';
import {
    resolveTransfersAdminSelectedGameweekId,
    selectionOrScoringGameweek,
    transfersAdminAvailableGameweeks,
} from './transfers-gameweek';

/**
 * Admin transfer review must default to the selection gameweek — the round managers are
 * submitting for — not the scoring gameweek. Mid-window after a deadline those differ, and
 * that was the bug: reviewers landed on the played GW and could not navigate to the next.
 *
 * After the final deadline there is no selection gameweek, but GW38's transfers still need
 * reviewing, so the page falls back to the scoring gameweek rather than closing.
 */

const events = fplBootstrap().events as EventData[];

/** Just after GW1’s deadline: scoring GW1, selection GW2. */
const MID_WINDOW = '2024-08-16T18:00:00Z';

const AFTER_SEASON = '2025-05-26T00:00:00Z';

afterEach(() => setNow(null));

describe('admin transfers default gameweek', () => {
    it('defaults to the selection gameweek when scoring and selection differ', () => {
        setNow(MID_WINDOW);
        const gameweeks = getGameweekData(events, new Date(MID_WINDOW));

        expect(findScoringGameweek(gameweeks, new Date(MID_WINDOW))?.fplEvent.id).toBe(1);
        expect(findSelectionGameweek(gameweeks, new Date(MID_WINDOW))?.fplEvent.id).toBe(2);

        expect(resolveTransfersAdminSelectedGameweekId(gameweeks, null)).toBe(2);
        expect(selectionOrScoringGameweek(gameweeks)?.fplEvent.id).toBe(2);
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

    it('falls back to the scoring gameweek once the final deadline has passed', () => {
        setNow(AFTER_SEASON);
        const gameweeks = getGameweekData(events, new Date(AFTER_SEASON));

        expect(findSelectionGameweek(gameweeks, new Date(AFTER_SEASON))).toBeUndefined();

        expect(resolveTransfersAdminSelectedGameweekId(gameweeks, null)).toBe(38);
        expect(selectionOrScoringGameweek(gameweeks)?.fplEvent.id).toBe(38);
        expect(transfersAdminAvailableGameweeks(gameweeks)).toHaveLength(38);
    });

    it('honours ?gameweek= after the final deadline', () => {
        setNow(AFTER_SEASON);
        const gameweeks = getGameweekData(events, new Date(AFTER_SEASON));

        expect(resolveTransfersAdminSelectedGameweekId(gameweeks, '38')).toBe(38);
    });

    it('has no gameweek when the calendar has not been loaded', () => {
        setNow(MID_WINDOW);

        expect(selectionOrScoringGameweek([])).toBeUndefined();
        expect(resolveTransfersAdminSelectedGameweekId([], null)).toBeUndefined();
        expect(transfersAdminAvailableGameweeks([])).toEqual([]);
    });
});
