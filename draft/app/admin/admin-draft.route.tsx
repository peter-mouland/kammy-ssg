/* Location: app/admin/admin-draft.route.tsx */

import { type ActionFunctionArgs, data, type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import type { DivisionId } from '../teams/types/team-types';
import { DraftSection } from './components/sections/draft-section';
import type { AdminActionType } from './types/admin-types';

interface ActionData {
    success?: boolean;
    error?: string;
    message?: string;
    data?: any;
}

export async function loader({ request }: LoaderFunctionArgs) {
    const { AdminOrchestrator } = await import('./server/services/admin-orchestrator.service');
    const orchestrator = new AdminOrchestrator();
    const systemStatus = await orchestrator.getSystemStatus();
    const sharedContext = await orchestrator.getSharedContext();

    return { systemStatus, sharedContext };
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
    const { sharedContext, systemStatus } = useLoaderData();

    return (
        <DraftSection
            divisions={sharedContext.sheetData.divisions}
            draftOrders={sharedContext.sheetData.draftOrder}
            managers={sharedContext.sheetData.managers}
            draftState={sharedContext.sheetData.draftState}
            draftStatus={systemStatus.draft}
        />
    );
}
