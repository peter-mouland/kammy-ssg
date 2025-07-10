/* Location: app/admin/admin-draft.route.tsx */

import { type ActionFunctionArgs, data, type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import type { DivisionId } from '../teams/types/team-types';
import { DraftSection } from './components/sections/draft-section';
import type { AdminActionType, AdminDashboardData } from './types/admin-types';

interface ActionData {
    success?: boolean;
    error?: string;
    message?: string;
    data?: any;
}

export async function getDraftAdminData(): Promise<AdminDashboardData> {
    const { AdminOrchestrator } = await import('./server/services/admin-orchestrator.service');
    const orchestrator = new AdminOrchestrator();
    const { sheetData } = await orchestrator.getSharedContext();
    const statusSummary = await orchestrator.getSystemStatus();
    const { divisions, draftState, draftOrder, managers } = sheetData;

    return {
        divisions,
        draftOrders: draftOrder,
        managers,
        draftState,
        draftStatus: statusSummary.draft,
    };
}

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const draftAdminData = await getDraftAdminData();
        return data(draftAdminData);
    } catch (error) {
        console.error('Draft admin loader error:', error);
        throw new Response('Failed to load draft setup data', { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs) {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get('actionType')?.trim() as AdminActionType;
        const divisionId = formData.get('divisionId')?.trim() as DivisionId;

        if (!actionType) {
            return data<ActionData>({ error: 'Action type is required' });
        }
    } catch (error) {
        console.error('Draft action error:', error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : 'Failed to perform draft action',
        });
    }
}

export default function AdminDraftRoute() {
    const { divisions, draftOrders, managers, draftState, draftStatus } = useLoaderData() as AdminDashboardData;

    return (
        <DraftSection
            divisions={divisions}
            draftOrders={draftOrders}
            managers={managers}
            draftState={draftState}
            draftStatus={draftStatus}
        />
    );
}
