/* Location: app/cup/server/actions/generate-autopicks.action.ts */

import { cupEligibleManagers } from '../../../_shared/lib/league-divisions';
import { readDivisions } from '../../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../../_shared/lib/sheets/user-teams';
import { getTeamsForGameweek } from '../../../scoring/index.server';
import { type AutopickCandidate, planAutopicks } from '../../lib/autopick';
import { getRoundForGameweek } from '../../lib/cup-config';
import { addCupSubmission, readCupConfig, readCupSubmissions } from '../cup-sheets';

export interface GenerateAutopicksResult {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Generate autopicks (rule 4.6) for every cup-eligible manager missing a
 * submission in a round. Pure planning lives in `planAutopicks` (unit-tested);
 * this wrapper only does I/O: reads, squad lookups, and appends.
 */
export async function generateAutopicksAction(input: { gameweek: number }): Promise<GenerateAutopicksResult> {
    const { gameweek } = input;

    // Fail fast on a bad gameweek before the heavier user-team reads.
    const [cupConfig, submissions] = await Promise.all([readCupConfig(), readCupSubmissions()]);
    const round = getRoundForGameweek(cupConfig, gameweek);
    if (!round) {
        return { success: false, error: `Gameweek ${gameweek} is not part of the cup.` };
    }
    const [allUserTeams, divisions] = await Promise.all([readUserTeams(), readDivisions()]);
    const userTeams = cupEligibleManagers(allUserTeams, divisions);

    const candidates: AutopickCandidate[] = [];
    for (const team of userTeams) {
        // Skip squad lookups for managers who already submitted: the plan
        // would skip them anyway, and each lookup is a Firestore read.
        if (submissions.some((s) => s.manager === team.userId && s.gameweek === gameweek)) continue;
        const squad = await getTeamsForGameweek(team.divisionId, team.userId, gameweek);
        candidates.push({ manager: team.userId, division: team.divisionId, roster: squad ? squad.roster : null });
    }

    const now = new Date();
    const outcome = planAutopicks({ candidates, submissions, cupConfig, round, gameweek, now });
    for (const row of outcome.rows) {
        await addCupSubmission(row);
    }

    const parts: string[] = [];
    if (outcome.autopicked.length > 0)
        parts.push(`Autopicked ${outcome.autopicked.length}: ${outcome.autopicked.join(', ')}`);
    for (const skip of outcome.skipped) {
        if (skip.reason !== 'already submitted') parts.push(`Skipped ${skip.manager} (${skip.reason})`);
    }
    if (parts.length === 0) return { success: true, message: 'Everyone has submitted for this round.' };
    return { success: true, message: `${parts.join('. ')}.` };
}
