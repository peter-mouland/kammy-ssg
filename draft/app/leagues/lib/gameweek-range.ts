/* Location: app/leagues/lib/gameweek-range.ts */

import type { EventData } from '../../_shared/lib/fpl/fpl-types';

/**
 * A run of consecutive gameweeks, both ends included -- what a monthly prize is played over.
 *
 * The site deliberately does not know which gameweeks make up a month: managers in different
 * divisions settle that differently, so the range comes from the URL (`?from=5&to=8`). That
 * also makes it shareable, which is what turns it into one agreed table rather than one each.
 */
export interface GameweekRange {
    from: number;
    to: number;
}

export const RANGE_PARAMS = ['from', 'to'] as const;

const parseGameweek = (value: string | null, currentGameweek: number): number | null => {
    if (value === null || !/^\d+$/.test(value)) return null;
    const gameweek = Number.parseInt(value, 10);
    return gameweek >= 1 && gameweek <= currentGameweek ? gameweek : null;
};

/**
 * The range a URL asks for, or `null` for the normal page.
 *
 * Anything unusable is ignored rather than an error: a stale shared link should still land
 * on a working standings page. Ends given the wrong way round are swapped, since the intent
 * is unambiguous.
 */
export function parseGameweekRange(searchParams: URLSearchParams, currentGameweek: number): GameweekRange | null {
    const from = parseGameweek(searchParams.get('from'), currentGameweek);
    const to = parseGameweek(searchParams.get('to'), currentGameweek);
    if (from === null || to === null) return null;
    return from <= to ? { from, to } : { from: to, to: from };
}

/** "Gameweeks 5-8", or "Gameweek 5" when the range is a single week. */
export function formatGameweekRange({ from, to }: GameweekRange): string {
    return from === to ? `Gameweek ${from}` : `Gameweeks ${from}-${to}`;
}

/** Every gameweek in the range, in order. */
export function gameweeksInRange({ from, to }: GameweekRange): number[] {
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/**
 * When a gameweek's points were scored: from its own deadline until the next gameweek's.
 *
 * Deliberately not `GameWeekData.start`/`end`. Those are the team-picking window -- previous
 * deadline to this one -- which sits a whole week earlier, so a gameweek played in early
 * September would read as August. `to` is null for the season's last gameweek.
 */
export interface GameweekScoringWindow {
    gameweek: number;
    from: string;
    to: string | null;
}

/** Just the part of a gameweek this needs, so it can be fed the app's calendar or a fixture. */
interface GameweekDeadline {
    fplEvent: Pick<EventData, 'id' | 'deadline_time'>;
}

const toIso = (deadline: string | Date): string => new Date(deadline).toISOString();

export function gameweekScoringWindows(range: GameweekRange, events: GameweekDeadline[]): GameweekScoringWindow[] {
    const deadlineOf = new Map(events.map((event) => [event.fplEvent.id, event.fplEvent.deadline_time]));

    return gameweeksInRange(range).flatMap((gameweek) => {
        const deadline = deadlineOf.get(gameweek);
        if (!deadline) return [];
        const nextDeadline = deadlineOf.get(gameweek + 1);
        return [{ gameweek, from: toIso(deadline), to: nextDeadline ? toIso(nextDeadline) : null }];
    });
}
