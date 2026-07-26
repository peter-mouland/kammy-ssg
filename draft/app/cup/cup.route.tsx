/* Location: app/cup/cup.route.tsx */

import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { getUserSelection } from '../_shared/features/user-selection/user-selection.utils';
import { readPlayerGameweekPointsFromSheet } from '../_shared/lib/sheets/player-gw-points';
import { readUserTeams } from '../_shared/lib/sheets/user-teams';
import { CupPage } from './cup.page';
import { isDeadlinePassed } from './lib/cup-deadlines';
import { buildCupFixtures } from './lib/cup-fixtures';
import { buildStageMatchups } from './lib/cup-matchups';
import { getCupPageData } from './server/cup.server';
import { readCupBracket, readCupConfig, readCupSubmissions } from './server/cup.sheet';
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
    const [currentGameweekData, events, userTeams, fixtures, teams] = await Promise.all([
        fplApiCache.getCurrentGameweekData(),
        fplApiCache.getFplEvents(),
        readUserTeams(),
        fplApiCache.getFplFixtures(),
        fplApiCache.getFplTeams(),
    ]);
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
        const currentId = currentGameweekData.fplEvent.id;
        const selectedGameweek = Number.isNaN(requested)
            ? cupGameweeks.includes(currentId)
                ? currentId
                : (cupGameweeks[0] ?? currentId)
            : requested;
        const gameweekData = events.find((event) => event.fplEvent.id === selectedGameweek) ?? currentGameweekData;

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
        console.error('Cup loader (config/submissions) error:', error);
        return data<CupPageData>({ ...EMPTY, gameweek: currentGameweekData.fplEvent.id, userTeams, selectedUserId });
    }
}

export default CupPage;
