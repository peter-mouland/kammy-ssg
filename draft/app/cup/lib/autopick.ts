/* Location: app/cup/lib/autopick.ts */

import type { DivisionId, ManagerId } from '../../_shared/types/league-types';
import type { TeamRoster } from '../../_shared/types/squad-types';
import type { CupConfig, CupRound, ProcessedCupSheetData } from '../types/cup-types';
import { getGameweekForStage } from './cup-config';
import { type CupSquadPlayer, getCupSquad } from './cup-squad';
import { findLatestSubmission } from './cup-submission';

/**
 * Auto-select a manager's cup team when they miss a deadline: take the required
 * number of eligible players from their squad, excluding any already used in the
 * other leg of the round, chosen alphabetically for a deterministic result.
 * Returns fewer than required only if the squad can't supply enough.
 */
export function generateAutopick(
    squad: CupSquadPlayer[],
    playersRequired: number,
    usedPlayers: number[] = [],
): number[] {
    const used = new Set(usedPlayers);
    // Alphabetical by squad name. Squad names are FPL web_names, which are
    // effectively surnames — this is the rule 4.6 autopick.
    return squad
        .filter((player) => !used.has(player.code))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, playersRequired)
        .map((player) => player.code);
}

export interface AutopickCandidate {
    manager: ManagerId;
    division: DivisionId;
    /** Null when the squad could not be loaded for this gameweek. */
    roster: TeamRoster | null;
}

export interface AutopickSkip {
    manager: ManagerId;
    reason: 'already submitted' | 'no squad found' | 'no eligible players';
}

export interface AutopickOutcome {
    /** Rows ready to append (rule 4.6 autopicks, marked as admin submissions). */
    rows: ProcessedCupSheetData[];
    autopicked: ManagerId[];
    skipped: AutopickSkip[];
}

/**
 * Plan autopicks (rule 4.6) for managers missing a submission in a round:
 * alphabetical picks from their squad, excluding the other leg's players.
 * Short squads still write what is available and are reported by the caller;
 * only an empty pick or a missing squad (or an existing submission) skips.
 */
export function planAutopicks(input: {
    candidates: AutopickCandidate[];
    submissions: ProcessedCupSheetData[];
    cupConfig: CupConfig;
    round: CupRound;
    gameweek: number;
    now: Date;
}): AutopickOutcome {
    const { candidates, submissions, cupConfig, round, gameweek, now } = input;
    const outcome: AutopickOutcome = { rows: [], autopicked: [], skipped: [] };

    for (const candidate of candidates) {
        if (findLatestSubmission(submissions, candidate.manager, gameweek)) {
            outcome.skipped.push({ manager: candidate.manager, reason: 'already submitted' });
            continue;
        }
        if (!candidate.roster) {
            outcome.skipped.push({ manager: candidate.manager, reason: 'no squad found' });
            continue;
        }
        // Same as getOtherLegGameweek (#158): use the helper once that PR merges.
        const otherGameweek = round.twoLegged
            ? getGameweekForStage(cupConfig, round.stage, round.leg === 1 ? 2 : 1)
            : null;
        const usedPlayers =
            otherGameweek === null
                ? []
                : (findLatestSubmission(submissions, candidate.manager, otherGameweek)?.players ?? []);
        const players = generateAutopick(getCupSquad(candidate.roster), round.playersRequired, usedPlayers);
        if (players.length === 0) {
            outcome.skipped.push({ manager: candidate.manager, reason: 'no eligible players' });
            continue;
        }
        outcome.rows.push({
            status: '',
            timestamp: now,
            manager: candidate.manager,
            division: candidate.division,
            gameweek,
            stage: round.stage,
            leg: round.leg,
            players,
            submittedByAdmin: true,
            adminReason: 'autopick',
        });
        outcome.autopicked.push(candidate.manager);
    }

    return outcome;
}
