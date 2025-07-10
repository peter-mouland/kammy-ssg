/* Location: app/admin/components/sections/points-scoring-section.tsx */

import { useFetcher } from 'react-router';
import type { SystemStatusSummary } from '../../types/admin-types';
import * as Icons from '../icons/admin-icons';
import { AdminContainer } from '../layout/admin-container';
import { AdminGrid } from '../layout/admin-grid';
import { AdminSection } from '../layout/admin-section';
import { ActionCard } from '../ui/action-card';
import { AdminMessage } from '../ui/admin-message';
import { GameweekPointsButton } from '../ui/gameweek-points-button';
import { GameweekPointsStatus } from '../ui/gameweek-points-status';

export const PointsScoringSection = ({ systemStatus }: { systemStatus: SystemStatusSummary }) => {
    const fetcher = useFetcher();

    const executeAction = (actionType: string) => {
        fetcher.submit(
            { actionType },
            { method: 'post' }, // Submit to current route
        );
    };

    return (
        <AdminContainer>
            <AdminSection title="Gameweek Points Management" icon={<Icons.ChartIcon />}>
                <GameweekPointsStatus systemStatus={systemStatus} />

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
                        title="Force Regenerate All Points"
                        description="Rerun from Gameweek 0"
                        icon={<Icons.RefreshIcon />}
                        buttonText="Force Regenerate"
                        actionType="forceRegenerateAllPoints"
                        onExecute={executeAction}
                        fetcher={fetcher}
                    />
                </AdminGrid>
            </AdminSection>

            <AdminSection title="Gameweek Game Points 👉 GSheets" icon={<Icons.TargetIcon />}>
                <AdminMessage type="info">
                    <strong>Gameweek Game Points:</strong> Generates a sheet with one column per gameweek game, showing
                    points for each player's performance in each specific game that gameweek.
                </AdminMessage>

                <GameweekPointsButton />
            </AdminSection>
        </AdminContainer>
    );
};
