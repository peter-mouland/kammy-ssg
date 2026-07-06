/* Location: app/cup/cup-submit.route.tsx */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { getUserSelection } from '../_shared/features/user-selection/user-selection.utils';
import { requestFormData } from '../_shared/lib/form-data';
import { readCupConfig, readCupSubmissions } from '../_shared/lib/sheets/cup';
import { readUserTeams } from '../_shared/lib/sheets/user-teams';
import type { DivisionId } from '../teams/types/team-types';
import { CupSubmitPage } from './cup-submit.page';
import { getCupSubmitData } from './server/cup.server';
import type { CupSubmitPageData } from './types/cup-page-types';

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
    const [currentGameweekData, userTeams] = await Promise.all([fplApiCache.getCurrentGameweekData(), readUserTeams()]);
    const persistedUser = getUserSelection(request);
    const selectedUser = userTeams.find((team) => team.userId === persistedUser.selectedUserId);

    try {
        const [cupConfig, submissions] = await Promise.all([readCupConfig(), readCupSubmissions()]);
        const pageData = await getCupSubmitData({ selectedUser, currentGameweekData, cupConfig, submissions });
        return data<CupSubmitPageData>(pageData);
    } catch (error) {
        console.error('Cup submit loader error:', error);
        return data<CupSubmitPageData>({
            hasConfig: false,
            round: null,
            selectedUserId: selectedUser?.userId ?? null,
            selectedUserName: selectedUser?.userName ?? null,
            division: selectedUser?.divisionId ?? null,
            squad: [],
            existingPlayers: [],
            usedPlayers: [],
            submissionOpen: false,
            deadline: String(currentGameweekData.fplEvent.deadline_time),
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
