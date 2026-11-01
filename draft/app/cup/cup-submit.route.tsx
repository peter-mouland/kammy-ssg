/* Location: app/cup/cup-submit.route.tsx */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { getUserSelection } from '../_shared/features/user-selection/user-selection.utils';
import { requestFormData } from '../_shared/lib/form-data';
import { describeGameweekAvailability } from '../_shared/lib/gameweek-availability';
import { cupEligibleManagers } from '../_shared/lib/league-divisions';
import { friendlyErrorResponse } from '../_shared/lib/loader-error';
import { readDivisions } from '../_shared/lib/sheets/divisions';
import { readUserTeams } from '../_shared/lib/sheets/user-teams';
import type { DivisionId } from '../_shared/types/league-types';
import { CupSubmitPage } from './cup-submit.page';
import { buildCupFixtures } from './lib/cup-fixtures';
import { CUP_STAGES } from './lib/cup-rules';
import { getCupSubmitData } from './server/cup.server';
import { readCupBracket, readCupConfig, readCupSubmissions } from './server/cup-sheets';
import type { CupSubmitPageData } from './types/cup-page-types';
import type { CupRound } from './types/cup-types';

export const meta: MetaFunction = () => {
    return [{ title: 'Submit Cup Team - Fantasy Football Draft' }];
};

interface CupActionData {
    success?: boolean;
    error?: string;
    message?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
    const { fplApiCache } = await import('../_shared/lib/fpl/api-cache');
    const [selectionGameweekData, events, allUserTeams, fplFixtures, teams] = await Promise.all([
        fplApiCache.getSelectionGameweekData(),
        fplApiCache.getFplEvents(),
        readUserTeams(),
        fplApiCache.getFplFixtures(),
        fplApiCache.getFplTeams(),
    ]);

    // No gameweek is an explainable state, not a crash -- the same guard /cup and the
    // other loaders use. Without it the reads below are a TypeError on an empty database.
    const availability = describeGameweekAvailability(events, selectionGameweekData);
    if (!availability.available) {
        throw friendlyErrorResponse(availability.title, availability.detail);
    }
    const selectionGameweek = availability.gameweek;

    // Only divisions whose `cup` flag is set take part. Without this the cup silently
    // includes every manager in the league -- no crash, just the wrong competition, with
    // people ranked for the 16 qualifying places who should not be in the running.
    const userTeams = cupEligibleManagers(allUserTeams, await readDivisions());
    const persistedUser = getUserSelection(request);
    const selectedUser = userTeams.find((team) => team.userId === persistedUser.selectedUserId);

    try {
        const [cupConfig, submissions, bracket] = await Promise.all([
            readCupConfig(),
            readCupSubmissions(),
            readCupBracket().catch(() => []),
        ]);

        // The manager's open play-off ties (rule 4.8) behave as extra single-leg
        // rounds outside the config: any four players, no reuse ban.
        const playoffRounds: CupRound[] = selectedUser
            ? bracket
                  .filter(
                      (matchup) =>
                          matchup.stage === 'playoff' &&
                          matchup.gameweek !== undefined &&
                          !matchup.winner &&
                          (matchup.home === selectedUser.userId || matchup.away === selectedUser.userId),
                  )
                  .map((matchup) => ({
                      stage: 'playoff' as const,
                      leg: 1,
                      gameweek: matchup.gameweek as number,
                      playersRequired: CUP_STAGES.playoff.playersRequired,
                      twoLegged: false,
                  }))
            : [];

        // Same gameweek resolution as /cup: ?gameweek wins, else current-if-cup, else first cup gameweek.
        const { resolveCupRounds } = await import('./lib/cup-config');
        const cupGameweeks = resolveCupRounds(cupConfig).map((round) => round.gameweek);
        const submittable = [...cupGameweeks, ...playoffRounds.map((round) => round.gameweek)];
        const requested = Number.parseInt(new URL(request.url).searchParams.get('gameweek') ?? '', 10);
        const currentId = selectionGameweek.fplEvent.id;
        const selectedGameweek = Number.isNaN(requested)
            ? submittable.includes(currentId)
                ? currentId
                : (submittable[0] ?? currentId)
            : requested;
        const gameweekData = events.find((event) => event.fplEvent.id === selectedGameweek) ?? selectionGameweek;
        const fixtures = buildCupFixtures(fplFixtures, teams, selectedGameweek);

        const pageData = await getCupSubmitData({
            userTeams,
            selectedUser,
            gameweekData,
            cupConfig,
            submissions,
            fixtures,
            extraRounds: playoffRounds,
        });
        return data<CupSubmitPageData>(pageData);
    } catch (error) {
        console.error('Cup submit loader error:', error);
        return data<CupSubmitPageData>({
            hasConfig: false,
            round: null,
            userTeams,
            selectedUserId: selectedUser?.userId ?? null,
            selectedUserName: selectedUser?.userName ?? null,
            division: selectedUser?.divisionId ?? null,
            squad: [],
            existingPlayers: [],
            usedPlayers: [],
            submissionOpen: false,
            deadline: String(selectionGameweek.fplEvent.deadline_time),
            selectedGameweek: selectionGameweek.fplEvent.id,
            gameweekOptions: [],
            fixtures: [],
        });
    }
}

export async function action({ request, context }: ActionFunctionArgs) {
    try {
        const formData = await requestFormData({ request, context });
        const manager = String(formData.get('manager') ?? '');
        const division = String(formData.get('division') ?? '') as DivisionId;
        const gameweek = Number.parseInt(String(formData.get('gameweek') ?? ''), 10);
        const players = String(formData.get('players') ?? '')
            .split(',')
            .map((code) => Number.parseInt(code.trim(), 10))
            .filter((code) => !Number.isNaN(code));

        const { handleCupSubmission } = await import('./server/actions/submit-cup-team.action');
        const result = await handleCupSubmission({ manager, division, gameweek, players });
        return data<CupActionData>(result);
    } catch (error) {
        console.error('Cup submit action error:', error);
        return data<CupActionData>({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to submit cup team',
        });
    }
}

export default CupSubmitPage;
