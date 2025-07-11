/* Location: app/admin/admin-points.route.tsx */

import { useOutletContext } from 'react-router';
import { GameweekProcessingSection } from './components/sections/gameweek-processing-section';
import type { AdminDataContext } from './types/admin-orchestrator-types';
import type { SystemStatusSummary } from './types/admin-types';

interface AdminOutletContext {
    systemStatus: SystemStatusSummary;
    sharedContext: AdminDataContext;
    transfersData: Record<string, any> | null;
    loadedAt: string;
}

export default function AdminPointsRoute() {
    const { sharedContext, systemStatus } = useOutletContext<AdminOutletContext>();

    return <GameweekProcessingSection systemStatus={systemStatus} sharedContext={sharedContext} />;
}
