/* Location: app/cup/server/actions/generate-autopicks.action.ts */

import { now as clockNow } from '../../../_shared/lib/clock';
import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import { cupEligibleManagers } from '../../../_shared/lib/league-divisions';
import { readDivisions } from '../../../_shared/lib/sheets/divisions';
import { readUserTeams } from '../../../_shared/lib/sheets/user-teams';
import { getDivisionTeamsDocument, getLatestScoredGameweek } from '../../../scoring/index.server';
import { type AutopickCandidate, planAutopicks } from '../../lib/autopick';
import { getRoundForGameweek } from '../../lib/cup-config';
import { isDeadlinePassed } from '../../lib/cup-deadlines';
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
    // Autopicks stand in for managers who missed the deadline (rule 4.6).
    // Running them while submissions are still open would lock in teams for
    // managers who might yet submit their own.
    const events = await fplApiCache.getFplEvents();
    const gameweekData = events.find((event) => event.fplEvent.id === gameweek);
    if (!gameweekData || !isDeadlinePassed(gameweekData)) {
        return {
            success: false,
            error: `Gameweek ${gameweek} is still open for submissions. Autopick after the deadline.`,
        };
    }
    const [allUserTeams, divisions] = await Promise.all([readUserTeams(), readDivisions()]);
    const userTeams = cupEligibleManagers(allUserTeams, divisions);

    // One document read per division, not one walk per manager: find each
    // division's latest scored gameweek once, read that document, and take
    // every missing manager's roster from it.
    const missing = userTeams.filter(
        (team) => !submissions.some((s) => s.manager === team.userId && s.gameweek === gameweek),
    );
    const rosterByManager = new Map<string, AutopickCandidate['roster']>();
    for (const divisionId of [...new Set(missing.map((team) => team.divisionId))]) {
        const latestScored = await getLatestScoredGameweek(divisionId, gameweek);
        const divisionDoc = latestScored === null ? null : await getDivisionTeamsDocument(divisionId, latestScored);
        for (const team of missing.filter((candidate) => candidate.divisionId === divisionId)) {
            rosterByManager.set(team.userId, divisionDoc?.teams[team.userId]?.roster ?? null);
        }
    }
    const candidates: AutopickCandidate[] = missing.map((team) => ({
        manager: team.userId,
        division: team.divisionId,
        roster: rosterByManager.get(team.userId) ?? null,
    }));

    const now = clockNow();
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
