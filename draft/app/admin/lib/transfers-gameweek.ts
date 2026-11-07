/* Location: app/admin/lib/transfers-gameweek.ts */

import { now } from '../../_shared/lib/clock';
import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import { findScoringGameweek, findSelectionGameweek } from '../../_shared/lib/fpl/gameweeks';

/**
 * Which gameweek admin transfer review opens on.
 *
 * Managers submit transfers for the **selection** gameweek (first deadline still ahead) —
 * the same answer `/transfers` uses via `getSelectionGameweekData()`. Admin used to default
 * to the **scoring** gameweek (matches in play), which left reviewers on the previous round
 * and capped the selector so the open window was unreachable without editing the URL.
 *
 * Once the final deadline has passed there is no selection gameweek, so review falls back to
 * scoring: GW38's transfers still have to be reviewed after GW38's deadline.
 */

/** The selection gameweek, or the scoring gameweek after the final deadline. Undefined only with no calendar. */
export function selectionOrScoringGameweek(events: GameWeekData[], at: Date = now()): GameWeekData | undefined {
    return findSelectionGameweek(events, at) ?? findScoringGameweek(events, at);
}

/**
 * Gameweek id to load: `?gameweek=` when it is a positive number, otherwise
 * `selectionOrScoringGameweek`. The id is not checked against the calendar.
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

    return selectionOrScoringGameweek(events, at)?.fplEvent.id;
}

/**
 * Selectable GW ids through `selectionOrScoringGameweek`, so the open transfer window is
 * always reachable when it sits one ahead of matches in play.
 */
export function transfersAdminAvailableGameweeks(events: GameWeekData[], at: Date = now()): number[] {
    const through = selectionOrScoringGameweek(events, at)?.fplEvent.id ?? 0;

    return Array.from({ length: through }, (_, i) => i + 1);
}
