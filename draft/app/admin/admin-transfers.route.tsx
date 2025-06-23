/* Location: app/admin/admin-transfers.route.tsx */

import { type ActionFunctionArgs, data, type LoaderFunctionArgs, type MetaFunction, useLoaderData } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
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
        // Import server functions dynamically to prevent client bundle inclusion
        const [{ getDraftAdminData }, { getTransfersAdminData }] = await Promise.all([
            import('./server/admin-dashboard.server'),
            import('./server/transfers-admin.server'),
        ]);

        // Get divisions from existing admin data
        const adminData = await getDraftAdminData();

        // Get transfers data for all divisions
        const transfersData = await getTransfersAdminData(adminData.divisions);

        return {
            divisions: adminData.divisions,
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
    const { divisions, transfersData } = useLoaderData<TransfersLoaderData>();

    return <TransfersSection divisions={divisions || []} transfersData={transfersData || {}} />;
}
