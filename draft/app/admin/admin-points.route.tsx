/* Location: app/admin/admin-points.route.tsx */

import { type ActionFunctionArgs, data, type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import { PointsScoringSection } from './components/sections/points-scoring-section';

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
        const actionType = formData.get('actionType');

        if (!actionType) {
            return data<ActionData>({ error: 'Action type is required' });
        }

        const { handlePointsActions } = await import('./server/points-actions.server');

        const result = await handlePointsActions({
            actionType: actionType.trim(),
        });

        return data<ActionData>(result);
    } catch (error) {
        console.error('Points action error:', error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : 'Failed to perform points action',
        });
    }
}

export default function AdminPointsRoute() {
    const { sharedContext, systemStatus } = useLoaderData();
    return <PointsScoringSection systemStatus={systemStatus} />;
}
