/* Location: app/transfers/transfers.route.tsx */

import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import type { DivisionId } from '../teams/types/team-types';
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

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const selectedDivision = (params.divisionId || 'premierLeague') as DivisionId;
        const selectedManager = url.searchParams.get('manager') || '';
        const selectedGameweek = Number.parseInt(url.searchParams.get('gameweek') || '0', 10);

        // Dynamic import to keep server code on server
        const { getTransfersPageData } = await import('./server/transfers.server');
        const transfersData = await getTransfersPageData({
            selectedDivision,
            selectedManager,
            selectedGameweek,
        });

        return data<TransfersPageData>(transfersData);
    } catch (error) {
        console.error('Transfers loader error:', error);
        throw new Response('Failed to load transfers data', { status: 500 });
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
