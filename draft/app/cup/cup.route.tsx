/* Location: app/cup/cup.route.tsx */

import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { readCupConfig, readCupSubmissions } from '../_shared/lib/sheets/cup';
import { readUserTeams } from '../_shared/lib/sheets/user-teams';
import { CupPage } from './cup.page';
import { getCupPageData } from './server/cup.server';
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
};

export async function loader(_args: LoaderFunctionArgs) {
    const { fplApiCache } = await import('../_shared/lib/fpl/api-cache');
    const [currentGameweekData, userTeams] = await Promise.all([fplApiCache.getCurrentGameweekData(), readUserTeams()]);

    // The cup config/sheet may not be set up yet — degrade gracefully rather than 500.
    try {
        const [cupConfig, submissions] = await Promise.all([readCupConfig(), readCupSubmissions()]);
        const pageData = getCupPageData({ userTeams, currentGameweekData, cupConfig, submissions });
        return data<CupPageData>(pageData);
    } catch (error) {
        console.error('Cup loader (config/submissions) error:', error);
        return data<CupPageData>({ ...EMPTY, gameweek: currentGameweekData.fplEvent.id });
    }
}

export default CupPage;
