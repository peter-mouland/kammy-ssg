/* Location: app/admin/admin-settings.route.tsx */

import { useOutletContext } from 'react-router';
import { CacheManagementSection } from './components/sections/cache-management-section';
import type { AdminDataContext } from './types/admin-orchestrator-types';
import type { SystemStatusSummary } from './types/admin-types';

interface AdminOutletContext {
    systemStatus: SystemStatusSummary;
    sharedContext: AdminDataContext;
    transfersData: Record<string, any> | null;
    cacheStats: any | null;
    loadedAt: string;
}

export default function AdminSettingsRoute() {
    const { sharedContext, systemStatus } = useOutletContext<AdminOutletContext>();

    return <CacheManagementSection systemStatus={systemStatus} sharedContext={sharedContext} />;
}
