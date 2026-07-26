// app/admin/components/sections/draft-section.tsx
// Enhanced with server-side sync status data and reset instructions

import { useActionData } from 'react-router';
import { groupByDivision } from '../../../_shared/lib/group-by-id';
import type { AdminDataContext } from '../../types/admin-orchestrator-types';
import type { AdminDashboardData } from '../../types/admin-types';
import * as Icons from '../icons/admin-icons';
import { AdminContainer } from '../layout/admin-container';
import { AdminGrid } from '../layout/admin-grid';
import { AdminSection } from '../layout/admin-section';
import { AdminMessage } from '../ui/admin-message';
import { DraftCard } from '../ui/draft-card';
import { DraftResetInstructions } from './draft-reset-instructions';
import { EnhancedDraftSyncSection } from './enhanced-draft-sync-section';

interface DraftSectionProps {
    divisions: AdminDashboardData['divisions'];
    draftOrders: AdminDashboardData['draftOrders'];
    managers: AdminDashboardData['managers'];
    draftStates: AdminDashboardData['draftStates'];
    draftStatus: AdminDashboardData['draftStatus'];
    draftSyncComparisons?: AdminDataContext['draftSyncComparisons']; // NEW: Server-side sync data
}

export const DraftSection = ({
    divisions,
    draftOrders,
    managers,
    draftStates,
    draftStatus,
    draftSyncComparisons,
}: DraftSectionProps) => {
    const userTeamsByDivision = groupByDivision(divisions, managers);
    const actionData = useActionData();

    return (
        <AdminContainer>
            <AdminSection title="Draft Management" icon={<Icons.UsersIcon />}>
                <AdminGrid columns="3" minWidth="300px">
                    {divisions.map((division) => (
                        <DraftCard
                            key={division.id}
                            division={division}
                            teams={userTeamsByDivision[division.id] || []}
                            orders={draftOrders[division.id] || []}
                            draftStates={draftStates}
                            draftStatus={draftStatus}
                        />
                    ))}
                </AdminGrid>

                {/* Action Messages */}
                {actionData?.success && actionData.message && (
                    <AdminMessage type="success">{actionData.message}</AdminMessage>
                )}
                {actionData?.error && <AdminMessage type="error">{actionData.error}</AdminMessage>}
            </AdminSection>

            {/* ENHANCED: Server-side sync section with real-time comparison data */}
            <AdminSection
                title="Firebase ↔ Sheets Sync Status"
                icon={<Icons.SyncIcon />}
                description="Real-time comparison between Firebase and Google Sheets draft data. Use sync buttons to resolve discrepancies."
            >
                <EnhancedDraftSyncSection
                    divisions={divisions}
                    draftStates={draftStates}
                    draftStatus={draftStatus}
                    draftSyncComparisons={draftSyncComparisons}
                />
            </AdminSection>

            {/* NEW: Draft Reset Instructions */}
            <DraftResetInstructions />
        </AdminContainer>
    );
};
