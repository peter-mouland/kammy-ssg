/* Location: app/admin/lib/transfers-gameweek.ts */

import { now } from '../../_shared/lib/clock';
import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import { findScoringGameweek, findSelectionGameweek } from '../../_shared/lib/fpl/gameweeks';

/**
 * Which gameweek admin transfer review focuses on.
 *
 * Managers submit transfers for the **selection** gameweek (first deadline still ahead) —
 * the same answer `/transfers` uses via `getSelectionGameweekData()`. Admin used to default
 * to the **scoring** gameweek (matches in play), which left reviewers on the previous round
 * and capped the selector so the open window was unreachable without editing the URL.
 */

/** The open transfer window, or undefined once the final deadline has passed. */
export function transfersAdminSelectionGameweek(
    events: GameWeekData[],
    at: Date = now(),
): GameWeekData | undefined {
    return findSelectionGameweek(events, at);
}

/**
 * Gameweek id to load: `?gameweek=` when present and valid, otherwise the selection GW.
 */
export function resolveTransfersAdminSelectedGameweekId(
    events: GameWeekData[],
    gameweekQueryParam: string | null | undefined,
    at: Date = now(),
): number | undefined {
    const parsed = Number.parseInt(gameweekQueryParam || '', 10);
    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }

    return findSelectionGameweek(events, at)?.fplEvent.id;
}

/**
 * Selectable GW ids through the later of scoring and selection, so the open transfer
 * window is always reachable when it sits one ahead of matches in play.
 */
export function transfersAdminAvailableGameweeks(events: GameWeekData[], at: Date = now()): number[] {
    const selectionId = findSelectionGameweek(events, at)?.fplEvent.id ?? 0;
    const scoringId = findScoringGameweek(events, at)?.fplEvent.id ?? 0;
    const through = Math.max(selectionId, scoringId);

    return through > 0 ? Array.from({ length: through }, (_, i) => i + 1) : [];
}
