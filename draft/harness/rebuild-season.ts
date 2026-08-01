/* Location: draft/harness/rebuild-season.ts */

import { readDivisions } from '../app/_shared/lib/sheets/divisions';
import { FplFirestore } from '../app/_shared/lib/fpl/fpl-firestore';
import { handleCommitTeamsToFirestore } from '../app/admin/index.server';
import {
    calculateSingleTeamPoints,
    getDivisionTeamsDocument,
    updateDivisionTeamsDocument,
    upsertDivisionTeamsDocument,
} from '../app/scoring/index.server';
import type { DivisionId } from '../app/_shared/types/league-types';

/**
 * Rebuild the whole season into the fixture Firestore, using the app's own pipeline.
 *
 * Firebase is empty and the stored `division-teams` documents cannot be recovered (they
 * are keyed `${divisionId}_gw${gameweek}` with no season, so the 2026/27 rollover
 * overwrote them in place). So the harness reconstructs them -- and because it does that
 * by *running the real code*, this is the single biggest piece of coverage in the whole
 * plan: draft picks in, 38 gameweeks of rosters and points out, through the real transfer
 * integration and the real `POSITION_RULES`.
 *
 * **It lives outside `app/` on purpose.** It has to reach both `admin` and `scoring`, and
 * `_shared` may not import a domain (`architecture.test.ts`, rule 1). The harness is not
 * part of the app, so `draft/harness/` is where cross-domain orchestration is honest. It
 * still goes through published APIs only -- `admin/index.server` and
 * `scoring/index.server` -- never a domain's internals.
 *
 * Preconditions, none of which this function sets up:
 *   - `KAMMY_FIXTURE_FIRESTORE=1`
 *   - MSW running with the fixture handlers (Sheets + FPL)
 *   - a clock, if you want a specific date
 */

export interface RebuildOptions {
    /** Highest gameweek to build. 38 is a full season; lower is much faster to iterate on. */
    throughGameweek?: number;
    /** Called after each gameweek, for a progress line on a long run. */
    onProgress?: (progress: { gameweek: number; of: number }) => void;
}

export interface RebuildSummary {
    divisions: DivisionId[];
    gameweeks: number;
    documentsWritten: number;
    /** Gameweeks a division could not produce a document for, as `leagueOne_gw12`. */
    failures: string[];
}

/**
 * Stage 1: FPL reference data into `fpl-bootstrap/{teams,events,elements}`.
 *
 * `populateBootstrap` filters elements to codes present in the `Players` sheet, which is
 * why the fixture bootstrap has to be the *merged* pool -- without the 54 synthesized
 * elements those roster slots resolve to nothing.
 */
async function populateFplReferenceData(): Promise<void> {
    await new FplFirestore().populateBootstrap();
}

/**
 * Stage 2: the GW0 documents, from the draft picks joined by `code`.
 *
 * Nothing can create GW0 automatically -- every later gameweek is a copy-forward of the
 * one before, so this is the seed the whole season hangs off.
 */
async function commitDraftedTeams(divisions: DivisionId[]): Promise<void> {
    for (const divisionId of divisions) {
        await handleCommitTeamsToFirestore(divisionId);
    }
}

/**
 * Stage 3, one gameweek for one division: copy forward, apply approved transfers, score.
 *
 * `upsertDivisionTeamsDocument` does the copy-and-transfer half (recursively, if earlier
 * gameweeks are missing). The scoring half mirrors `background-jobs.server.ts` without its
 * progress-store plumbing, which is a job-tracking concern the harness has no use for.
 */
async function buildGameweek(divisionId: DivisionId, gameweek: number): Promise<boolean> {
    const divisionDoc = await upsertDivisionTeamsDocument(divisionId, gameweek, {});
    if (!divisionDoc) return false;

    const previousDivisionDoc = await getDivisionTeamsDocument(divisionId, gameweek - 1);

    for (const [userId, teamData] of Object.entries(divisionDoc.teams ?? {})) {
        // The cast mirrors what the production caller already passes
        // (`background-jobs.server.ts:194`): `teams[userId]` is `{ roster }` while the
        // parameter is typed `TeamGameweekData`, and `previousDivisionDoc` is null at GW1.
        // Both are pre-existing looseness in that signature -- tightening it is a change to
        // the app, not to the harness, so this keeps the harness honest about calling it
        // exactly as production does rather than papering over the difference.
        await calculateSingleTeamPoints({
            divisionId,
            gameweek,
            userId,
            teamData,
            divisionDoc,
            previousDivisionDoc,
        } as unknown as Parameters<typeof calculateSingleTeamPoints>[0]);
    }

    // calculateSingleTeamPoints mutates divisionDoc.teams in place; this is what persists
    // it. The dotted `metadata.*` paths are Firestore field paths, not literal keys.
    const stampedAt = new Date().toISOString();
    await updateDivisionTeamsDocument(divisionId, gameweek, {
        teams: divisionDoc.teams,
        'metadata.updatedAt': stampedAt,
        'metadata.pointsLastUpdated': stampedAt,
        'metadata.pointsLastGameweek': gameweek,
    } as Parameters<typeof updateDivisionTeamsDocument>[2]);

    return true;
}

/** Run the whole thing. Expect seconds, not milliseconds -- it reads every element summary. */
export async function rebuildSeason(options: RebuildOptions = {}): Promise<RebuildSummary> {
    const { throughGameweek = 38, onProgress } = options;

    const divisions = (await readDivisions()).map((division) => division.id as DivisionId);
    const failures: string[] = [];
    let documentsWritten = 0;

    await populateFplReferenceData();
    await commitDraftedTeams(divisions);
    documentsWritten += divisions.length; // the GW0 documents

    for (let gameweek = 1; gameweek <= throughGameweek; gameweek++) {
        for (const divisionId of divisions) {
            const built = await buildGameweek(divisionId, gameweek);
            if (built) {
                documentsWritten++;
            } else {
                failures.push(`${divisionId}_gw${gameweek}`);
            }
        }

        onProgress?.({ gameweek, of: throughGameweek });
    }

    return { divisions, gameweeks: throughGameweek, documentsWritten, failures };
}
