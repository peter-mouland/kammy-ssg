// app/admin/components/sections/draft-section.tsx
// Enhanced with better sync status - minimal changes to existing structure

import { useActionData } from 'react-router';
import { groupByDivision } from '../../../_shared/lib/group-by-id';
import type { AdminDashboardData } from '../../types/admin-types';
import * as Icons from '../icons/admin-icons';
import { AdminContainer } from '../layout/admin-container';
import { AdminGrid } from '../layout/admin-grid';
import { AdminSection } from '../layout/admin-section';
import { AdminButton } from '../ui/admin-button';
import { AdminMessage } from '../ui/admin-message';
import { DraftCard } from '../ui/draft-card';
import { DraftSyncSection } from './draft-sync-section';
import { EnhancedDraftSyncSection } from './enhanced-draft-sync-section'; // NEW: Enhanced sync component

interface DraftSectionProps {
    divisions: AdminDashboardData['divisions'];
    draftOrders: AdminDashboardData['draftOrders'];
    managers: AdminDashboardData['managers'];
    draftStates: AdminDashboardData['draftStates'];
    draftStatus: AdminDashboardData['draftStatus'];
}

export const DraftSection = ({ divisions, draftOrders, managers, draftStates, draftStatus }: DraftSectionProps) => {
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

            {/* ENHANCED: Better sync section with multi-division support */}
            <AdminSection
                title="Firebase ↔ Sheets Sync Status"
                icon={<Icons.SyncIcon />}
                description="Monitor sync status between Firebase (real-time) and Google Sheets (source of truth). Use sync buttons to resolve discrepancies."
            >
                <EnhancedDraftSyncSection divisions={divisions} draftStates={draftStates} draftStatus={draftStatus} />
            </AdminSection>
        </AdminContainer>
    );
};
