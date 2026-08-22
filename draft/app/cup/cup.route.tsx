/* Location: app/cup/cup.route.tsx */

import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { getUserSelection } from '../_shared/features/user-selection/user-selection.utils';
import { describeGameweekAvailability } from '../_shared/lib/gameweek-availability';
import { cupEligibleManagers } from '../_shared/lib/league-divisions';
import { friendlyErrorResponse } from '../_shared/lib/loader-error';
import { readDivisions } from '../_shared/lib/sheets/divisions';
import { readPlayerGameweekPointsFromSheet } from '../_shared/lib/sheets/player-gw-points';
import { readUserTeams } from '../_shared/lib/sheets/user-teams';
import { CupPage } from './cup.page';
import { isDeadlinePassed } from './lib/cup-deadlines';
import { buildCupFixtures } from './lib/cup-fixtures';
import { buildStageMatchups } from './lib/cup-matchups';
import { getCupPageData } from './server/cup.server';
import { readCupBracket, readCupConfig, readCupSubmissions } from './server/cup-sheets';
import type { CupPageData } from './types/cup-page-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'Cup - Fantasy Football Draft' },
        { name: 'description', content: 'Cup standings and knockout progress' },
    ];
};

const EMPTY: CupPageData = {
    hasConfig: false,
    round: null,
    gameweek: 0,
    deadlinePassed: false,
    rows: [],
    standings: [],
    qualifiers: [],
    bracket: [],
    selectedGameweek: 0,
    gameweekOptions: [],
    fixtures: [],
    stageMatchups: [],
    userTeams: [],
    selectedUserId: null,
};

export async function loader({ request }: LoaderFunctionArgs) {
    const { fplApiCache } = await import('../_shared/lib/fpl/api-cache');
    const [selectionGameweekData, events, allUserTeams, fixtures, teams] = await Promise.all([
        fplApiCache.getSelectionGameweekData(),
        fplApiCache.getFplEvents(),
        readUserTeams(),
        fplApiCache.getFplFixtures(),
        fplApiCache.getFplTeams(),
    ]);

    // Only divisions whose `cup` flag is set take part. Without this the cup silently
    // includes every manager in the league -- no crash, just the wrong competition, with
    // people ranked for the 16 qualifying places who should not be in the running.
    const userTeams = cupEligibleManagers(allUserTeams, await readDivisions());

    // No current gameweek is an explainable state, not a crash. Distinguishes an
    // unpopulated database from a season that has ended or not yet begun.
    const availability = describeGameweekAvailability(events, selectionGameweekData);
    if (!availability.available) {
        throw friendlyErrorResponse(availability.title, availability.detail);
    }
    // Past the guard there is a gameweek; take it from the guard rather than re-reading
    // the nullable it was given, so the rest of the loader needs no further checks.
    const selectionGameweek = availability.gameweek;

    const selectedUserId = getUserSelection(request).selectedUserId;

    // The cup config/sheet may not be set up yet — degrade gracefully rather than 500.
    try {
        const [cupConfig, submissions, pointsRows, bracket] = await Promise.all([
            readCupConfig(),
            readCupSubmissions(),
            readPlayerGameweekPointsFromSheet(),
            readCupBracket().catch(() => []),
        ]);

        // Which gameweek to view: an explicit ?gameweek wins; otherwise the current
        // gameweek if it's a cup gameweek, else the first configured cup gameweek.
        const { resolveCupRounds } = await import('./lib/cup-config');
        const cupGameweeks = resolveCupRounds(cupConfig).map((round) => round.gameweek);
        const requested = Number.parseInt(new URL(request.url).searchParams.get('gameweek') ?? '', 10);
        const currentId = selectionGameweek.fplEvent.id;
        const selectedGameweek = Number.isNaN(requested)
            ? cupGameweeks.includes(currentId)
                ? currentId
                : (cupGameweeks[0] ?? currentId)
            : requested;
        const gameweekData = events.find((event) => event.fplEvent.id === selectedGameweek) ?? selectionGameweek;

        const pageData = getCupPageData({ userTeams, gameweekData, cupConfig, submissions, pointsRows });
        const cupFixtures = buildCupFixtures(fixtures, teams, selectedGameweek);

        // For a knockout stage, pair the drawn bracket into head-to-head matchups with scores.
        const eventsById = new Map(events.map((event) => [event.fplEvent.id, event]));
        const userNameById = new Map(userTeams.map((team) => [team.userId, team.userName]));
        const stageMatchups =
            pageData.round && pageData.round.stage !== 'league'
                ? buildStageMatchups({
                      bracket,
                      round: pageData.round,
                      cupConfig,
                      submissions,
                      pointsRows,
                      userNameById,
                      deadlinePassedFor: (gameweek) => {
                          const event = eventsById.get(gameweek);
                          return event ? isDeadlinePassed(event) : false;
                      },
                  })
                : [];

        return data<CupPageData>({
            ...pageData,
            bracket,
            fixtures: cupFixtures,
            stageMatchups,
            userTeams,
            selectedUserId,
        });
    } catch (error) {
        if (error instanceof Response) throw error;
        console.error('Cup loader (config/submissions) error:', error);
        return data<CupPageData>({ ...EMPTY, gameweek: selectionGameweek.fplEvent.id, userTeams, selectedUserId });
    }
}

export default CupPage;
