/* Location: app/_shared/lib/gameweek-availability.ts */

import { now } from './clock';
import type { GameWeekData } from './fpl/fpl-types';

/**
 * Why there is no current gameweek — in words a manager can act on.
 *
 * Four loaders read `currentGameweekData.fplEvent.id` and crash with
 * `Cannot read properties of undefined (reading 'fplEvent')` when there isn't one. That is
 * technically accurate and useless: it names a property, not a situation.
 *
 * **Three different situations produce it, and conflating them would be a lie.** An empty
 * database is not an ended season, and telling someone "the season has ended" when really
 * nobody has loaded the data yet sends them looking in the wrong place entirely.
 */

export type GameweekAvailability =
    | { available: true; gameweek: GameWeekData }
    | { available: false; title: string; detail: string; isSetupProblem: boolean };

/** ISO strings once they have been through Firestore, Dates when freshly built. */
const timeOf = (value: Date | string | number | undefined): number => new Date(value ?? 0).getTime();

export function describeGameweekAvailability(
    events: GameWeekData[] | null | undefined,
    current: GameWeekData | null | undefined,
    at: Date = now(),
): GameweekAvailability {
    if (current) return { available: true, gameweek: current };

    // No calendar at all. Not a season state -- nothing has been loaded.
    if (!events || events.length === 0) {
        return {
            available: false,
            isSetupProblem: true,
            title: 'The gameweek calendar has not been loaded yet',
            detail:
                'This league has no gameweek data, so there is nothing to show. An admin needs to populate ' +
                'it from Settings → Admin, which fetches the season calendar and player data.',
        };
    }

    const deadlines = events.map((event) => timeOf(event.fplEvent?.deadline_time)).filter(Boolean);
    const lastDeadline = Math.max(...deadlines);
    const when = at.getTime();

    if (deadlines.length > 0 && when > lastDeadline) {
        return {
            available: false,
            isSetupProblem: false,
            title: 'The season has ended',
            detail: 'The final gameweek is over, so there is no live gameweek to show. Next season’s fixtures will appear here once they are published.',
        };
    }

    // A calendar exists and we are inside it, but nothing is flagged current -- the gap
    // between fixtures being published and the first deadline.
    return {
        available: false,
        isSetupProblem: false,
        title: 'The season has not started yet',
        detail: 'Fixtures are published but the first gameweek has not opened, so there are no points to show yet.',
    };
}
