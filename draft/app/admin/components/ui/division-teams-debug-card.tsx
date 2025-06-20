// app/admin/components/ui/division-teams-debug-card.tsx
import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { ActionCard } from './action-card';

export const DivisionTeamsDebugCard = () => {
    const fetcher = useFetcher();

    const executeAction = (actionType: string) => {
        fetcher.submit({ actionType }, { method: 'post' });
    };

    return (
        <ActionCard
            title="Ensure Division Documents"
            description="Manually ensure all division-teams documents exist for current gameweeks"
            icon={<Icons.DatabaseIcon />}
            buttonText="Create Missing Docs"
            actionType="ensureDivisionTeamDocuments"
            onExecute={executeAction}
            fetcher={fetcher}
            variant="secondary"
        />
    );
};
