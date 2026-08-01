/* Location: app/_shared/lib/league-divisions.ts */

import type { DivisionId } from '../types/league-types';

/**
 * Which divisions this build of the app understands.
 *
 * `DivisionId` is a compile-time union, which means it says nothing at runtime about a
 * spreadsheet somebody edited this morning. This is the runtime half of the same fact, and
 * it exists because the two drifted: a fourth division (`greatScott`) was added to the
 * sheet across `Divisions`, `UserTeams`, `DraftOrder` and `DraftState`, and the app's only
 * reaction was `Cannot read properties of undefined (reading 'push')` on the admin page.
 *
 * Adding a division is a code change, not just a sheet change — scoring, promotion and
 * relegation all assume a known set. The point of this module is that the app should
 * **say** that, clearly, rather than crashing and leaving someone to infer it from a stack
 * trace.
 */

export const KNOWN_DIVISION_IDS: readonly DivisionId[] = ['premierLeague', 'championship', 'leagueOne'];

const isKnown = (id: string): id is DivisionId => (KNOWN_DIVISION_IDS as readonly string[]).includes(id);

/** Division ids present in the data that this build does not recognise. Deduped, ordered. */
export function unknownDivisionIds(ids: readonly (string | null | undefined)[]): string[] {
    const unknown = new Set<string>();

    for (const id of ids) {
        const trimmed = (id ?? '').trim();
        if (trimmed && !isKnown(trimmed)) unknown.add(trimmed);
    }

    return [...unknown].sort();
}

/**
 * A sentence naming the mismatch, or null when there is nothing to report.
 *
 * Written to be pasted straight into an error page: it names the offending ids, says what
 * the app does know, and makes clear this is a code change rather than a data mistake to
 * be undone.
 */
export function describeUnknownDivisions(ids: readonly (string | null | undefined)[]): string | null {
    const unknown = unknownDivisionIds(ids);
    if (unknown.length === 0) return null;

    const list = unknown.map((id) => `“${id}”`).join(', ');
    const plural = unknown.length > 1 ? 'divisions' : 'a division';

    return (
        `The spreadsheet contains ${plural} this app does not recognise: ${list}. ` +
        `It currently supports ${KNOWN_DIVISION_IDS.join(', ')}. ` +
        'Adding a division needs a code change as well as a sheet change, because scoring and ' +
        'promotion/relegation both assume a fixed set — until then, data for it is ignored.'
    );
}
