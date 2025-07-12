/* Location: app/admin/admin-transfers.route.tsx */

import { type MetaFunction, useOutletContext, useSearchParams } from 'react-router';
import type { DivisionSheetData } from '../teams/types/team-types';
import type { TransferAdminOverviewData } from '../transfers/types/transfer-rule-types';
import { TransfersSection } from './components/sections/transfers-section';
import type { AdminDataContext } from './types/admin-orchestrator-types';
import type { SystemStatusSummary } from './types/admin-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'Transfer Management - Fantasy Football Admin' },
        { name: 'description', content: 'Manage and approve fantasy football transfers with rule-based validation' },
    ];
};

interface AdminOutletContext {
    systemStatus: SystemStatusSummary;
    sharedContext: AdminDataContext;
    transfersData: Record<string, TransferAdminOverviewData> | null;
    loadedAt: string;
}

export default function AdminTransfersRoute() {
    const { sharedContext, systemStatus, transfersData } = useOutletContext<AdminOutletContext>();
    const [searchParams] = useSearchParams();

    // Get filter parameters from URL
    const selectedDivisionId = searchParams.get('division') || sharedContext.sheetData.divisions[0]?.id;
    const selectedGameweekId =
        Number.parseInt(searchParams.get('gameweek') || '', 10) || systemStatus.currentGameweek.fplEvent.id;

    // Find the selected division and gameweek objects
    const selectedDivision: DivisionSheetData =
        sharedContext.sheetData.divisions.find((d: DivisionSheetData) => d.id === selectedDivisionId) ||
        sharedContext.sheetData.divisions[0];

    const selectedGameweek =
        sharedContext.fplData.events.find((gw) => gw.fplEvent.id === selectedGameweekId) ||
        systemStatus.currentGameweek;

    return (
        <TransfersSection
            divisions={sharedContext.sheetData.divisions}
            selectedDivision={selectedDivision}
            selectedGameweek={selectedGameweek}
            transfersData={transfersData}
            sharedContext={sharedContext}
            systemStatus={systemStatus}
        />
    );
}
