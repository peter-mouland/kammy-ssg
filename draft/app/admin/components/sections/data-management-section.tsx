// /admin/components/sections/data-management-section.tsx (REFACTORED)
import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { ActionCard } from '../ui/action-card';
import { CacheStatusDisplay } from '../ui/cache-status-display';
import { AdminSection, AdminGrid, AdminContainer } from '../layout';

interface DataManagementSectionProps {
    expandedSections: Set<string>;
    toggleSection: (section: string) => void;
}

export const DataManagementSection = ({
                                          expandedSections,
                                          toggleSection
                                      }: DataManagementSectionProps) => {
    const fetcher = useFetcher();

    const executeAction = (actionType: string, variant?: string) => {
        const payload: any = { actionType };
        if (variant) payload.variant = variant;
        fetcher.submit(payload, { method: 'post' });
    };

    return (
        <AdminContainer>
            <AdminSection
                title="Cache Status"
                icon={<Icons.DatabaseIcon />}
            >
                <CacheStatusDisplay />
            </AdminSection>

            <AdminSection
                title="Manual Cache Clearing"
                icon={<Icons.TrashIcon />}
                collapsible={true}
                expanded={expandedSections.has('cache-management')}
                onToggle={() => toggleSection('cache-management')}
            >
                <AdminGrid columns="auto" minWidth="250px">
                    <ActionCard
                        title="Clear Player Summaries"
                        description="Clear player summaries only (fastest)"
                        buttonText="Clear Elements"
                        actionType="clearFirestoreData"
                        onExecute={(actionType) => executeAction(actionType, 'elements-only')}
                        fetcher={fetcher}
                    />
                    <ActionCard
                        title="Clear FPL Data"
                        description="Clear FPL bootstrap + elements"
                        buttonText="Clear FPL"
                        actionType="clearFirestoreData"
                        onExecute={(actionType) => executeAction(actionType, 'fpl-only')}
                        fetcher={fetcher}
                    />
                    <ActionCard
                        title="Clear Everything"
                        description="Clear everything (nuclear option)"
                        buttonText="Clear All"
                        actionType="clearFirestoreData"
                        onExecute={(actionType) => executeAction(actionType, 'all')}
                        fetcher={fetcher}
                    />
                </AdminGrid>
            </AdminSection>
        </AdminContainer>
    );
};
