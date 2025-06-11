// /admin/components/sections/quick-actions-section.tsx (REFACTORED)
import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { ActionCard } from '../ui/action-card';
import { AdminSection, AdminGrid } from '../layout';

interface QuickActionsSectionProps {
    cacheData: any;
}

export const QuickActionsSection = ({ cacheData }: QuickActionsSectionProps) => {
    const fetcher = useFetcher();

    const executeAction = (actionType: string) => {
        fetcher.submit({ actionType }, { method: 'post' });
    };

    const getRecommendedAction = () => {
        if (!cacheData) return null;
        if (cacheData.missing?.elements || cacheData.missing?.teams) return 'populateBootstrapData';
        if (cacheData.missing?.elementSummaries) return 'populateElementSummaries';
        if (cacheData.missing?.draftData) return 'generateEnhancedDataFast';
        return 'generateGameWeekPoints';
    };

    const recommendedAction = getRecommendedAction();

    return (
        <AdminSection title="Quick Actions">
            <AdminGrid columns="auto" minWidth="250px">
                <ActionCard
                    title="1. Populate Bootstrap Data"
                    description="Fetch FPL teams, events, and basic player data"
                    icon={<Icons.DatabaseIcon />}
                    buttonText="Populate Bootstrap"
                    actionType="populateBootstrapData"
                    onExecute={executeAction}
                    fetcher={fetcher}
                    recommended={recommendedAction === 'populateBootstrapData'}
                />
                <ActionCard
                    title="2. Populate Weekly Stats"
                    description="Fetch statistics for all players + weeks"
                    icon={<Icons.ChartIcon />}
                    buttonText="Populate Stats"
                    actionType="populateElementSummaries"
                    onExecute={executeAction}
                    fetcher={fetcher}
                    recommended={recommendedAction === 'populateElementSummaries'}
                />
                <ActionCard
                    title="3. Generate Draft Data"
                    description="Add draft calculations and enhanced data"
                    icon={<Icons.TargetIcon />}
                    buttonText="Generate Draft Data"
                    actionType="generateEnhancedDataFast"
                    onExecute={executeAction}
                    fetcher={fetcher}
                    recommended={recommendedAction === 'generateEnhancedDataFast'}
                />
                <ActionCard
                    title="4. Update Gameweek Points"
                    description="Smart update - only generates changed gameweeks"
                    icon={<Icons.TrendingUpIcon />}
                    buttonText="Update Points"
                    actionType="generateGameWeekPoints"
                    onExecute={executeAction}
                    fetcher={fetcher}
                    recommended={recommendedAction === 'generateGameWeekPoints'}
                />
            </AdminGrid>
        </AdminSection>
    );
};
