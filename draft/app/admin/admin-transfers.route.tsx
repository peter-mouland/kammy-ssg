/* Location: app/admin/admin-transfers.route.tsx */

import { type ActionFunctionArgs, data, type LoaderFunctionArgs, type MetaFunction, useLoaderData } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import type { GameWeekData } from '../_shared/lib/fpl/fpl-types';
import { readDivisions } from '../_shared/lib/sheets/divisions';
import type { DivisionId, DivisionSheetData } from '../teams/types/team-types';
import type { TransferAdminOverviewData } from '../transfers/types/transfer-rule-types';
import { TransfersSection } from './components/sections/transfers-section';

export const meta: MetaFunction = () => {
    return [
        { title: 'Transfer Management - Fantasy Football Admin' },
        { name: 'description', content: 'Manage and approve fantasy football transfers with rule-based validation' },
    ];
};

interface TransfersLoaderData {
    divisions: DivisionSheetData[];
    gameweek: GameWeekData;
    transfersData: Record<DivisionId, TransferAdminOverviewData>;
}

interface TransfersActionData {
    success?: boolean;
    error?: string;
    message?: string;
    data?: unknown;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<TransfersLoaderData> {
    try {
        const url = new URL(request.url);
        const selectedDivision: DivisionId = (url.searchParams.get('division') || 'leagueOne') as DivisionId;
        const selectedGameweek = Number.parseInt(url.searchParams.get('gameweek') || '1', 10);
        // Import server functions dynamically to prevent client bundle inclusion
        const [{ getTransfersAdminData }, { fplApiCache }] = await Promise.all([
            import('./server/transfers-admin.server'),
            import('../_shared/lib/fpl/api-cache'),
        ]);
        const divisions = await readDivisions();
        const gameweekData = await fplApiCache.getFplEvents();
        const gameweek = gameweekData.find((gw) => gw.fplEvent.id === selectedGameweek);
        const transfersData = await getTransfersAdminData(divisions, gameweek);

        return {
            divisions,
            gameweek,
            transfersData,
        };
    } catch (error) {
        console.error('Transfers admin loader error:', error);
        throw new Response('Failed to load transfers data', { status: 500 });
    }
}

export async function action({ request }: ActionFunctionArgs): Promise<TransfersActionData> {
    try {
        const formData = await requestFormData({ request });
        const actionType = formData.get('actionType')?.trim();
        const divisionId = formData.get('divisionId')?.trim();

        if (!actionType) {
            return data<TransfersActionData>({
                error: 'Action type is required',
            });
        }

        // Import server functions dynamically
        const { handleTransfersActions } = await import('./server/transfers-admin.server');

        const result = await handleTransfersActions({
            actionType: actionType as any,
            divisionId: divisionId as any,
            transferId: formData.get('transferId')?.trim(),
            recommendation: formData.get('recommendation')?.trim() as any,
        });

        return data<TransfersActionData>(result);
    } catch (error) {
        console.error('Transfers action error:', error);
        return data<TransfersActionData>({
            error: error instanceof Error ? error.message : 'Failed to perform transfers action',
        });
    }
}

export default function AdminTransfersRoute() {
    const { divisions, transfersData, gameweek } = useLoaderData<TransfersLoaderData>();

    return <TransfersSection divisions={divisions || []} gameweek={gameweek} transfersData={transfersData || {}} />;
}
