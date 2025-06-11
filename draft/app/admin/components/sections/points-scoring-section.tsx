// /admin/components/sections/points-scoring-section.tsx (REFACTORED)
import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { ActionCard } from '../ui/action-card';
import { AdminMessage } from '../ui/admin-message';
import { GameweekPointsStatus } from '../ui/gameweek-points-status';
import { GameweekPointsButton } from '../ui/gameweek-points-button';
import { AdminSection, AdminGrid, AdminContainer } from '../layout';

export const PointsScoringSection = () => {
    const fetcher = useFetcher();

    const executeAction = (actionType: string) => {
        fetcher.submit({ actionType }, { method: 'post' });
    };

    return (
        <AdminContainer>
            <AdminSection
                title="Gameweek Points Management"
                icon={<Icons.ChartIcon />}
            >
                <GameweekPointsStatus />

                <AdminGrid columns="auto" minWidth="250px" gap="lg">
                    <ActionCard
                        title="Smart Points Update"
                        description="Automatically detects and updates only changed gameweeks"
                        icon={<Icons.TrendingUpIcon />}
                        buttonText="Update Points"
                        actionType="generateGameWeekPoints"
                        onExecute={executeAction}
                        fetcher={fetcher}
                        recommended={true}
                    />
                    <ActionCard
                        title="Force Regenerate All"
                        description="Regenerate all points from scratch (slower)"
                        icon={<Icons.RefreshIcon />}
                        buttonText="Force Regenerate"
                        actionType="forceRegenerateAllPoints"
                        onExecute={executeAction}
                        fetcher={fetcher}
                    />
                </AdminGrid>
            </AdminSection>

            <AdminSection
                title="Gameweek Game Points 👉 GSheets"
                icon={<Icons.TargetIcon />}
            >
                <AdminMessage type="info">
                    <strong>Gameweek Game Points:</strong> Generates a sheet with one column per gameweek game,
                    showing points for each player's performance in each specific game that gameweek.
                </AdminMessage>

                <GameweekPointsButton />
            </AdminSection>
        </AdminContainer>
    );
};
