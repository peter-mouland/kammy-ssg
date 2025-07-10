// /admin/components/sections/overview-section.tsx (UPDATED with Cache Monitor)
import * as Icons from '../icons/admin-icons';
import { ActionBar } from '../layout/action-bar';
import { AdminContainer } from '../layout/admin-container';
import { AdminGrid } from '../layout/admin-grid';
import { AdminSection } from '../layout/admin-section';
import { StatusCard } from '../ui/status-card';

interface SectionProps {
    expandedSections: Set<string>;
    toggleSection: (section: string) => void;
}

export const OverviewSection = ({ systemStatus, sharedContext }: SectionProps) => {
    return (
        <AdminContainer>
            <AdminSection
                title="System Health"
                icon={<Icons.BarChartIcon />}
                description="Monitor system status and data availability"
                actions={
                    <ActionBar align={'right'}>
                        {systemStatus.systemHealth.overall.status === 'healthy'
                            ? '✅'
                            : systemStatus.systemHealth.overall.status === 'warning'
                              ? '⚠️'
                              : '❌'}{' '}
                        {systemStatus.systemHealth.overall.status}
                    </ActionBar>
                }
            >
                <AdminGrid columns="auto" minWidth="200px">
                    <StatusCard
                        icon="🎯"
                        label="1. Draft Management"
                        percentage={`${systemStatus.draft.stage}`}
                        status={'healthy' as 'healthy' | 'warning' | 'critical'}
                    />
                    <StatusCard
                        icon="⚽"
                        label="2. Transfers"
                        percentage={`${systemStatus.transfers.pending} pending`}
                        status={systemStatus.transfers.pending ? 'warning' : 'healthy'}
                    />
                    <StatusCard
                        icon="📊"
                        label="3. GameWeek Processing"
                        percentage={
                            systemStatus.gameweekProcessing.lastProcessedGameweek === systemStatus.currentGameweek
                                ? `GameWeek ${systemStatus.currentGameweek} processed`
                                : `GameWeek ${systemStatus.currentGameweek} changed (was ${systemStatus.gameweekProcessing.lastProcessedGameweek}) | `
                        }
                        status={
                            systemStatus.gameweekProcessing.lastProcessedGameweek === systemStatus.currentGameweek
                                ? 'healthy'
                                : 'warning'
                        }
                    />
                </AdminGrid>
            </AdminSection>

            <AdminSection title="Recommendations" icon={<Icons.TrendingUpIcon />} description="">
                <ul>
                    {systemStatus.recommendations?.map((rec, index) => (
                        <li key={index}>{rec}</li>
                    ))}
                </ul>
            </AdminSection>
        </AdminContainer>
    );
};
