import { useActionData } from 'react-router';
import { groupByDivision } from '../../../_shared/lib/group-by-id';
import type { AdminDashboardData } from '../../types/admin-types';
import * as Icons from '../icons/admin-icons';
import { AdminContainer } from '../layout/admin-container';
import { AdminGrid } from '../layout/admin-grid';
import { AdminSection } from '../layout/admin-section';
import { AdminMessage } from '../ui/admin-message';
import { DraftCard } from '../ui/draft-card';
import { FirebaseSyncSection } from './firebase-sync-section';

interface DraftSectionProps {
    divisions: AdminDashboardData['divisions'];
    draftOrders: AdminDashboardData['draftOrders'];
    managers: AdminDashboardData['managers'];
    draftState: AdminDashboardData['draftState'];
    draftStatus: AdminDashboardData['draftStatus'];
}

export const DraftSection = ({ divisions, draftOrders, managers, draftState, draftStatus }: DraftSectionProps) => {
    const userTeamsByDivision = groupByDivision(divisions, managers);
    const actionData = useActionData();

    return (
        <AdminContainer>
            <AdminSection title="Draft Management" icon={<Icons.UsersIcon />}>
                <AdminGrid columns="auto" minWidth="300px">
                    {divisions.map((division) => (
                        <DraftCard
                            key={division.id}
                            division={division}
                            teams={userTeamsByDivision[division.id] || []}
                            orders={draftOrders[division.id] || []}
                            draftState={draftState}
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

            <AdminSection
                title="Firebase + GSheets Sync"
                icon={<Icons.SyncIcon />}
                description="If the GSheet was manually changed (e.g. a drafted player remove), we will need to sync"
            >
                <FirebaseSyncSection />
            </AdminSection>
        </AdminContainer>
    );
};
