/* Location: app/_shared/lib/league-divisions.ts */

import type { DivisionId, DivisionSheetData } from '../types/league-types';

/**
 * What each division takes part in — read from the `Divisions` sheet, not inferred.
 *
 * This used to be inferred from the id: promotion was `divisionId !== 'premierLeague'`,
 * relegation was `divisionId !== 'leagueOne'`. That quietly encoded "there are exactly
 * three divisions and they form a single pyramid", and it stopped being true when
 * `greatScott` was added — a fourth division that takes part in nothing cross-division.
 *
 * **Position cannot express that.** By `order` greatScott is bottom, so deriving the rules
 * from rank would have moved relegation onto it and taken it off leagueOne: exactly
 * backwards. Membership is a fact about each division, so each division states it, in the
 * sheet, where the league is actually administered.
 */

/** Divisions this build has a `DivisionId` for. The sheet may legitimately contain more. */
export const KNOWN_DIVISION_IDS: readonly DivisionId[] = ['premierLeague', 'championship', 'leagueOne', 'greatScott'];

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

/** Just the divisions that play in the cup. The cup is cross-division, but not all-division. */
export function cupDivisions(divisions: readonly DivisionSheetData[]): DivisionSheetData[] {
    return divisions.filter((division) => division.cup);
}

/**
 * The managers eligible for the cup.
 *
 * The cup page reads every manager in the league and ranks them for 16 qualifying places.
 * With a division that does not play in it, "every manager" is the wrong set — and wrong
 * silently, since nothing crashes: the standings simply contain people who should not be
 * in them, competing for places against people who should.
 */
export function cupEligibleManagers<T extends { divisionId: DivisionId }>(
    managers: readonly T[],
    divisions: readonly DivisionSheetData[],
): T[] {
    const playing = new Set(cupDivisions(divisions).map((division) => division.id));

    // No division rules at all means nothing has been configured yet; excluding everyone
    // would empty the cup, which is a worse failure than including everyone.
    if (playing.size === 0) return [...managers];

    return managers.filter((manager) => playing.has(manager.divisionId));
}
