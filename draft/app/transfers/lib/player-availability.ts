/* Location: app/transfers/lib/player-availability.ts */

import type { PlayerAvailability, PlayerAvailabilityStatus } from '../../_shared/components/availability-icon';
import type { FplPlayerData } from '../../_shared/lib/fpl/fpl-types';

export type AvailabilityByCode = Record<FplPlayerData['code'], PlayerAvailability>;

/** FPL's availability for the players it has doubts about, with when our copy was fetched. */
export interface AvailabilitySnapshot {
    byCode: AvailabilityByCode;
    /** When this copy came from FPL (ISO). Drives the page's "as of" time. */
    fetchedAt: string;
}

const NOT_AVAILABLE: ReadonlySet<string> = new Set<PlayerAvailabilityStatus>(['d', 'i', 's', 'u', 'n']);

/**
 * Each doubtful, injured, suspended or unavailable player's FPL status, keyed by `code` like
 * every other player lookup. Available players are left out: they are most of the squad
 * list, and "no entry" already means "nothing to flag", which keeps the payload small.
 */
export function buildAvailabilityByCode(elements: FplPlayerData[]): AvailabilityByCode {
    const byCode: AvailabilityByCode = {};
    for (const element of elements) {
        if (!NOT_AVAILABLE.has(element.status)) {
            continue;
        }
        byCode[element.code] = {
            status: element.status as PlayerAvailabilityStatus,
            ...(element.chance_of_playing_next_round === null || element.chance_of_playing_next_round === undefined
                ? {}
                : { chanceNextRound: element.chance_of_playing_next_round }),
        };
    }
    return byCode;
}

/** Where the streamed availability has got to, as the transfer steps see it. */
export type AvailabilityState =
    | { kind: 'loading' }
    | { kind: 'ready'; snapshot: AvailabilitySnapshot }
    | { kind: 'unavailable' };

const UK_TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
const UK_DAY_AND_TIME = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
});
const UK_DATE = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeZone: 'Europe/London' });

/**
 * The line under a transfer step's heading. It always says something, so a page with no
 * icons never reads as "everyone is fit": the time of the copy, that it's still coming, or
 * that it can't be shown. UK time, as on the rest of the site. The day is added when the
 * copy is from an earlier day, which a copy up to six hours old can be just after midnight.
 */
export function describeAvailabilityAsOf(state: AvailabilityState, now: Date): string {
    if (state.kind === 'loading') {
        return 'Checking injury and suspension news…';
    }
    if (state.kind === 'unavailable') {
        return 'Injury and suspension news is unavailable right now';
    }
    const fetchedAt = new Date(state.snapshot.fetchedAt);
    const sameDay = UK_DATE.format(fetchedAt) === UK_DATE.format(now);
    return `Injury and suspension news as of ${(sameDay ? UK_TIME : UK_DAY_AND_TIME).format(fetchedAt)}`;
}
