/* Location: app/admin/admin-draft.route.tsx */

import { useOutletContext } from 'react-router';
import { DraftSection } from './components/sections/draft-section';
import type { AdminDataContext } from './types/admin-orchestrator-types';
import type { SystemStatusSummary } from './types/admin-types';

interface AdminOutletContext {
    systemStatus: SystemStatusSummary;
    sharedContext: AdminDataContext;
    transfersData: Record<string, any> | null;
    loadedAt: string;
}

export default function AdminDraftRoute() {
    const { sharedContext, systemStatus } = useOutletContext<AdminOutletContext>();

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
