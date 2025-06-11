// /admin/components/sections/draft-section.tsx (REFACTORED)
import React from 'react';
import { useActionData } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { DraftCard } from '../ui/draft-card';
import { AdminMessage } from '../ui/admin-message';
import { AdminSection, AdminGrid, AdminContainer } from '../layout';
import { FirebaseSyncSection } from './firebase-sync-section';

interface DraftSectionProps {
    divisions: any[];
    draftOrders: Record<string, any[]>;
    userTeamsByDivision: Record<string, any[]>;
    draftState: any;
}

export const DraftSection = ({
                                 divisions,
                                 draftOrders,
                                 userTeamsByDivision,
                                 draftState
                             }: DraftSectionProps) => {
    const actionData = useActionData();

    return (
        <AdminContainer>
            <AdminSection
                title="Draft Management"
                icon={<Icons.UsersIcon />}
            >
                <AdminGrid columns="auto" minWidth="300px">
                    {divisions.map((division) => (
                        <DraftCard
                            key={division.id}
                            division={division}
                            teams={userTeamsByDivision[division.id] || []}
                            orders={draftOrders[division.id] || []}
                            draftState={draftState}
                        />
                    ))}
                </AdminGrid>

                {/* Action Messages */}
                {actionData?.success && actionData.message && (
                    <AdminMessage type="success">
                        {actionData.message}
                    </AdminMessage>
                )}
                {actionData?.error && (
                    <AdminMessage type="error">
                        {actionData.error}
                    </AdminMessage>
                )}
            </AdminSection>

            <AdminSection
                title="Firebase + GSheets Sync"
                icon={<Icons.SyncIcon />}
                description="If the GSheet was manually changed (e.g. a drafted player remove), we will need to sync"
            >
                <AdminMessage type="info">
                    <strong>Tip:</strong> Use this after manually editing picks in sheets or if Firebase shows wrong turn/state.
                </AdminMessage>

                <FirebaseSyncSection />
            </AdminSection>
        </AdminContainer>
    );
};
