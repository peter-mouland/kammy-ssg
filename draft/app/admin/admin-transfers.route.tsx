/* Location: app/admin/admin-transfers.route.tsx */

import { type MetaFunction, useOutletContext, useSearchParams } from 'react-router';
import type { FplTeam } from '../_shared/lib/fpl/fpl-types';
import type { DivisionSheetData } from '../_shared/types/league-types';
import type { TransferAdminOverviewData } from '../transfers';
import { TransfersSection } from './components/sections/transfers-section';
import {
    resolveTransfersAdminSelectedGameweekId,
    transfersAdminSelectionGameweek,
} from './lib/transfers-gameweek';
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
    teamsByCode: Record<number, FplTeam> | null;
    loadedAt: string;
}

export default function AdminTransfersRoute() {
    const { sharedContext, transfersData, teamsByCode } = useOutletContext<AdminOutletContext>();
    const [searchParams] = useSearchParams();

    // Selection GW is the open transfer window. The loader throws a friendly response when
    // there isn't one; this keeps the narrowing local rather than asserting a gameweek the
    // type no longer promises.
    const selectionGameweek = transfersAdminSelectionGameweek(sharedContext.fplData.events);
    if (!selectionGameweek) {
        return <p>There is no current gameweek, so there are no transfers to review.</p>;
    }

    // Get filter parameters from URL — default to selection, not scoring.
    const selectedDivisionId = searchParams.get('division') || sharedContext.sheetData.divisions[0]?.id;
    const selectedGameweekId =
        resolveTransfersAdminSelectedGameweekId(sharedContext.fplData.events, searchParams.get('gameweek')) ??
        selectionGameweek.fplEvent.id;

    // Find the selected division and gameweek objects
    const selectedDivision: DivisionSheetData =
        sharedContext.sheetData.divisions.find((d: DivisionSheetData) => d.id === selectedDivisionId) ||
        sharedContext.sheetData.divisions[0];

    const selectedGameweek =
        sharedContext.fplData.events.find((gw) => gw.fplEvent.id === selectedGameweekId) || selectionGameweek;

    return (
        <TransfersSection
            divisions={sharedContext.sheetData.divisions}
            selectedDivision={selectedDivision}
            selectedGameweek={selectedGameweek}
            teamsByCode={teamsByCode}
            transfersData={transfersData}
            sharedContext={sharedContext}
        />
    );
}
