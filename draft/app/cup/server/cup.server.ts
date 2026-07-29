/* Location: app/cup/server/cup.server.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { UserTeamsSheetData } from '../../_shared/types/league-types';
import { getGameweekForStage, getRoundForGameweek, resolveCupRounds } from '../lib/cup-config';
import { isDeadlinePassed, isSubmissionOpen } from '../lib/cup-deadlines';
import type { CupFixture } from '../lib/cup-fixtures';
import { CUP_STAGES } from '../lib/cup-rules';
import { buildGameweekPointsMap, type PlayerPointsRow, scoreSubmission } from '../lib/cup-scoring';
import { getCupSquad } from '../lib/cup-squad';
import { computeLeagueStandings, getQualifiers, type ScoredSubmission } from '../lib/cup-standings';
import { getTeamVisibility } from '../lib/cup-visibility';
import type {
    CupGameweekOption,
    CupOverviewRow,
    CupPageData,
    CupQualifier,
    CupSubmitPageData,
} from '../types/cup-page-types';
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
    gameweekData: GameWeekData;
    cupConfig: CupConfig;
    submissions: ProcessedCupSheetData[];
    pointsRows: PlayerPointsRow[];
    now?: Date;
}): Omit<CupPageData, 'bracket' | 'fixtures' | 'stageMatchups' | 'userTeams' | 'selectedUserId'> {
    const { userTeams, gameweekData, cupConfig, submissions, pointsRows } = input;
    const now = input.now ?? new Date();
    const gameweek = gameweekData.fplEvent.id;
    const round = getRoundForGameweek(cupConfig, gameweek);
    const deadlinePassed = isDeadlinePassed(gameweekData, now);
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

    const { standings, qualifiers } = getCupStandings({ userTeams, cupConfig, submissions, pointsRows });

    const gameweekOptions: CupGameweekOption[] = resolveCupRounds(cupConfig).map((r) => ({
        gameweek: r.gameweek,
        label: `${CUP_STAGES[r.stage].label}${r.twoLegged ? ` L${r.leg}` : ''} · GW${r.gameweek}`,
    }));

    return {
        hasConfig: !!round,
        round,
        gameweek,
        deadlinePassed,
        rows,
        standings,
        qualifiers,
        selectedGameweek: gameweek,
        gameweekOptions,
    };
}

/**
 * League-stage standings + qualifiers across every configured league gameweek,
 * using the site's existing per-player league points (no double counting).
 * Shared by the overview and the admin draw generation.
 */
export function getCupStandings(input: {
    userTeams: UserTeamsSheetData[];
    cupConfig: CupConfig;
    submissions: ProcessedCupSheetData[];
    pointsRows: PlayerPointsRow[];
}) {
    const { userTeams, cupConfig, submissions, pointsRows } = input;

    // Build one points map per league gameweek up front rather than rebuilding it (an
    // O(players) pass) for every submission — scoring is on the app's hot path.
    const leaguePointsMaps = new Map(
        cupConfig.league.map((gameweek) => [gameweek, buildGameweekPointsMap(pointsRows, gameweek)]),
    );

    const scored: ScoredSubmission[] = submissions
        .filter((submission) => cupConfig.league.includes(submission.gameweek))
        .map((submission) => ({
            manager: submission.manager,
            gameweek: submission.gameweek,
            points: scoreSubmission(submission.players, leaguePointsMaps.get(submission.gameweek) ?? new Map()),
            isAutopick: submission.adminReason === 'autopick',
        }));

    const standings = computeLeagueStandings(scored, cupConfig.league);
    const userNameById = new Map(userTeams.map((team) => [team.userId, team.userName]));
    const qualifiers: CupQualifier[] = getQualifiers(standings).map((manager) => {
        const standing = standings.find((s) => s.manager === manager);
        return { manager, userName: userNameById.get(manager) ?? manager, rank: standing?.rank ?? 0 };
    });

    return { standings, qualifiers };
}

/**
 * Build the submission context for the selected manager: their squad to pick
 * from, any existing submission, and the players they already used in the other
 * leg of this round (which they cannot reuse).
 */
export async function getCupSubmitData(input: {
    userTeams: UserTeamsSheetData[];
    selectedUser: UserTeamsSheetData | undefined;
    gameweekData: GameWeekData;
    cupConfig: CupConfig;
    submissions: ProcessedCupSheetData[];
    fixtures: CupFixture[];
    now?: Date;
}): Promise<CupSubmitPageData> {
    const { userTeams, selectedUser, gameweekData, cupConfig, submissions, fixtures } = input;
    const now = input.now ?? new Date();
    const gameweek = gameweekData.fplEvent.id;
    const round = getRoundForGameweek(cupConfig, gameweek);
    const submissionOpen = isSubmissionOpen(gameweekData, now);
    const rawDeadline = gameweekData.fplEvent.deadline_time;
    const deadline = typeof rawDeadline === 'string' ? rawDeadline : rawDeadline.toISOString();

    const gameweekOptions: CupGameweekOption[] = resolveCupRounds(cupConfig).map((r) => ({
        gameweek: r.gameweek,
        label: `${CUP_STAGES[r.stage].label}${r.twoLegged ? ` L${r.leg}` : ''} · GW${r.gameweek}`,
    }));

    const empty: CupSubmitPageData = {
        hasConfig: !!round,
        round,
        userTeams,
        selectedUserId: selectedUser?.userId ?? null,
        selectedUserName: selectedUser?.userName ?? null,
        division: selectedUser?.divisionId ?? null,
        squad: [],
        existingPlayers: [],
        usedPlayers: [],
        submissionOpen,
        deadline,
        selectedGameweek: gameweek,
        gameweekOptions,
        fixtures,
    };

    if (!selectedUser || !round) return empty;

    // Load the manager's roster for this gameweek from their own division.
    const { getTeamsForGameweek } = await import('../../scoring/index.server');
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
