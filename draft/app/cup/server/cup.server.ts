/* Location: app/cup/server/cup.server.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { UserTeamsSheetData } from '../../teams/types/team-types';
import { getGameweekForStage, getRoundForGameweek } from '../lib/cup-config';
import { isDeadlinePassed, isSubmissionOpen } from '../lib/cup-deadlines';
import { buildGameweekPointsMap, type PlayerPointsRow, scoreSubmission } from '../lib/cup-scoring';
import { getCupSquad } from '../lib/cup-squad';
import { computeLeagueStandings, getQualifiers, type ScoredSubmission } from '../lib/cup-standings';
import { getTeamVisibility } from '../lib/cup-visibility';
import type { CupOverviewRow, CupPageData, CupQualifier, CupSubmitPageData } from '../types/cup-page-types';
import type { CupConfig, ProcessedCupSheetData } from '../types/cup-types';

/** A submission's subs count as confirmed once an admin has approved it (Status = 'Y'). */
function isConfirmed(submission: ProcessedCupSheetData | undefined): boolean {
    return submission?.status === 'Y';
}

function findSubmission(
    submissions: ProcessedCupSheetData[],
    manager: string,
    gameweek: number,
): ProcessedCupSheetData | undefined {
    return submissions.find((s) => s.manager === manager && s.gameweek === gameweek);
}

/**
 * Build the cross-division cup overview for the current gameweek's round: every
 * manager with their team's visibility (hidden until deadline + subs confirmed).
 */
export function getCupPageData(input: {
    userTeams: UserTeamsSheetData[];
    currentGameweekData: GameWeekData;
    cupConfig: CupConfig;
    submissions: ProcessedCupSheetData[];
    pointsRows: PlayerPointsRow[];
    now?: Date;
}): CupPageData {
    const { userTeams, currentGameweekData, cupConfig, submissions, pointsRows } = input;
    const now = input.now ?? new Date();
    const gameweek = currentGameweekData.fplEvent.id;
    const round = getRoundForGameweek(cupConfig, gameweek);
    const deadlinePassed = isDeadlinePassed(currentGameweekData, now);
    const currentPoints = buildGameweekPointsMap(pointsRows, gameweek);

    const rows: CupOverviewRow[] = userTeams.map((team) => {
        const submission = findSubmission(submissions, team.userId, gameweek);
        const visibility = getTeamVisibility({
            hasSubmission: !!submission,
            deadlinePassed,
            subsConfirmed: isConfirmed(submission),
        });
        const revealed = visibility === 'revealed' && submission;
        return {
            manager: team.userId,
            userName: team.userName,
            teamName: team.teamName,
            division: team.divisionId,
            visibility,
            players: revealed ? submission.players : null,
            points: revealed ? scoreSubmission(submission.players, currentPoints) : null,
        };
    });

    // League-stage standings across every configured league gameweek, using the
    // site's existing per-player league points (no double counting).
    const scored: ScoredSubmission[] = submissions
        .filter((submission) => cupConfig.league.includes(submission.gameweek))
        .map((submission) => ({
            manager: submission.manager,
            gameweek: submission.gameweek,
            points: scoreSubmission(submission.players, buildGameweekPointsMap(pointsRows, submission.gameweek)),
            isAutopick: submission.adminReason === 'autopick',
        }));

    const standings = computeLeagueStandings(scored, cupConfig.league);
    const userNameById = new Map(userTeams.map((team) => [team.userId, team.userName]));
    const qualifiers: CupQualifier[] = getQualifiers(standings).map((manager) => {
        const standing = standings.find((s) => s.manager === manager);
        return { manager, userName: userNameById.get(manager) ?? manager, rank: standing?.rank ?? 0 };
    });

    return { hasConfig: !!round, round, gameweek, deadlinePassed, rows, standings, qualifiers };
}

/**
 * Build the submission context for the selected manager: their squad to pick
 * from, any existing submission, and the players they already used in the other
 * leg of this round (which they cannot reuse).
 */
export async function getCupSubmitData(input: {
    selectedUser: UserTeamsSheetData | undefined;
    currentGameweekData: GameWeekData;
    cupConfig: CupConfig;
    submissions: ProcessedCupSheetData[];
    now?: Date;
}): Promise<CupSubmitPageData> {
    const { selectedUser, currentGameweekData, cupConfig, submissions } = input;
    const now = input.now ?? new Date();
    const gameweek = currentGameweekData.fplEvent.id;
    const round = getRoundForGameweek(cupConfig, gameweek);
    const submissionOpen = isSubmissionOpen(currentGameweekData, now);
    const rawDeadline = currentGameweekData.fplEvent.deadline_time;
    const deadline = typeof rawDeadline === 'string' ? rawDeadline : rawDeadline.toISOString();

    const empty: CupSubmitPageData = {
        hasConfig: !!round,
        round,
        selectedUserId: selectedUser?.userId ?? null,
        selectedUserName: selectedUser?.userName ?? null,
        division: selectedUser?.divisionId ?? null,
        squad: [],
        existingPlayers: [],
        usedPlayers: [],
        submissionOpen,
        deadline,
    };

    if (!selectedUser || !round) return empty;

    // Load the manager's roster for this gameweek from their own division.
    const { getTeamsForGameweek } = await import('../../scoring/server/services/division-teams.service');
    const team = await getTeamsForGameweek(selectedUser.divisionId, selectedUser.userId, gameweek);
    const squad = team ? getCupSquad(team.roster) : [];

    const existing = findSubmission(submissions, selectedUser.userId, gameweek);

    // For leg 2 of a two-legged round, gather the players used in leg 1.
    let usedPlayers: number[] = [];
    if (round.twoLegged && round.leg === 2) {
        const otherGameweek = getGameweekForStage(cupConfig, round.stage, 1);
        if (otherGameweek !== null) {
            usedPlayers = findSubmission(submissions, selectedUser.userId, otherGameweek)?.players ?? [];
        }
    }

    return {
        ...empty,
        squad,
        existingPlayers: existing?.players ?? [],
        usedPlayers,
    };
}
