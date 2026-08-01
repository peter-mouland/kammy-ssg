/* Location: app/transfers/transfers.route.tsx */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { getUserSelection } from '../_shared/features/user-selection/user-selection.utils';
import { requestFormData } from '../_shared/lib/form-data';
import { loaderErrorResponse } from '../_shared/lib/loader-error';
import { readDivisions } from '../_shared/lib/sheets/divisions';
import { readUserTeams } from '../_shared/lib/sheets/user-teams';
import { TransfersPage } from './transfers.page';
import type { TransfersPageData } from './types/transfer-form-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'Player Transfers - Fantasy Football Draft' },
        { name: 'description', content: 'Submit and manage player transfers for your fantasy football team' },
    ];
};

interface ActionData {
    success?: boolean;
    error?: string;
    message?: string;
    data?: any;
}

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const { fplApiCache } = await import('../_shared/lib/fpl/api-cache');
        const [currentGameweekData, events, userTeams, divisions] = await Promise.all([
            fplApiCache.getCurrentGameweekData(),
            fplApiCache.getFplEvents(),
            readUserTeams(),
            readDivisions(),
        ]);
        const persistedUser = getUserSelection(request);
        const selectedUser = userTeams.find((t) => t.userId === persistedUser.selectedUserId);

        const end = new Date(currentGameweekData.fplEvent.deadline_time);
        const isPastDeadline = new Date() > end;
        const currentGameweek = isPastDeadline ? currentGameweekData.fplEvent.id + 1 : currentGameweekData.fplEvent.id;
        const selectedDivision = selectedUser?.divisionId;
        const selectedGameweek = Number.parseInt(
            url.searchParams.get('gameweek') || String(currentGameweek) || '1',
            10,
        );

        // Dynamic import to keep server code on server
        const { getTransfersPageData } = await import('./server/transfers.server');
        const transfersData = await getTransfersPageData({
            selectedDivision,
            selectedUser,
            selectedGameweek,
            currentGameweek,
            currentGameweekData,
            userTeams,
            events,
            divisions,
        });

        return data<TransfersPageData>({ ...transfersData, userTeams, persistedUser });
    } catch (error) {
        throw loaderErrorResponse('Could not load transfers', error);
    }
}

export async function action({ request, context }: ActionFunctionArgs) {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get('actionType');

        if (!actionType) {
            return data<ActionData>({ error: 'Action type is required' });
        }

        // Dynamic import to keep server code on server
        const { handleTransferSubmission } = await import('./server/actions/submit-transfer.action');

        const result = await handleTransferSubmission({
            actionType: actionType.toString(),
            formData,
        });

        return data<ActionData>(result);
    } catch (error) {
        console.error('Transfer action error:', error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : 'Failed to submit transfer',
        });
    }
}

export default TransfersPage;
