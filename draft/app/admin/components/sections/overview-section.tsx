// /admin/components/sections/overview-section.tsx
import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { StatusCard } from '../ui/status-card';
import { AdminSection, AdminGrid, AdminContainer } from '../layout';
import { QuickActionsSection } from './quick-actions-section';
import { ActionCard } from '../ui/action-card';

interface SectionProps {
    expandedSections: Set<string>;
    toggleSection: (section: string) => void;
}
export const OverviewSection = ({
                                    expandedSections,
                                    toggleSection
                                } : SectionProps) => {
    const fetcher = useFetcher();
    const clearDatafetcher = useFetcher();
    const [cacheData, setCacheData] = React.useState(null);

    // Fetch cache status when component mounts (not firestore stats)
    React.useEffect(() => {
        if (fetcher.state === 'idle' && !cacheData) {
            fetcher.submit({ actionType: 'getCacheStatus' }, { method: 'post' });
        }
    }, [fetcher, cacheData]);

    // Process fetcher response
    React.useEffect(() => {
        if (fetcher.data?.success && fetcher.data?.data) {
            setCacheData(fetcher.data.data);
        }
    }, [fetcher.data]);


    const executeAction = (actionType: string, variant?: string) => {
        const formData = new FormData();
        formData.append('actionType', actionType);
        formData.append('variant', variant || 'all');
        clearDatafetcher.submit(formData, { method: 'post' });
    };


    // Calculate status for each card
    const getBootstrapStatus = () => {
        if (!cacheData) return { status: 'warning', value: '...' };

        const hasBootstrap = (cacheData.counts.elements) > 0;
        return {
            status: hasBootstrap ? 'healthy' : 'warning',
            value: hasBootstrap ? '✓' : 'Missing'
        };
    };

    const getPlayerStatsStatus = () => {
        if (!cacheData) return { status: 'warning', value: '...' };

        const hasStats = (cacheData.counts.elementSummaries) > 0;
        return {
            status: hasStats ? 'healthy' : 'warning',
            value: hasStats ? '✓' : 'Missing'
        };
    };

    const getDraftDataStatus = () => {
        if (!cacheData) return { status: 'warning', value: '...' };

        return {
            status: cacheData.hasEnhancedData ? 'healthy' : 'warning',
            value: cacheData.hasEnhancedData ? 'Ready' : 'Pending'
        };
    };

    const bootstrapStatus = getBootstrapStatus();
    const playerStatsStatus = getPlayerStatsStatus();
    const draftDataStatus = getDraftDataStatus();

    return (
        <AdminContainer>
            <AdminSection
                title="System Overview"
                icon={<Icons.BarChartIcon />}
            >
                <AdminGrid columns="auto" minWidth="200px">
                    <StatusCard
                        icon="📊"
                        label="FPL Bootstrap"
                        percentage={bootstrapStatus.value}
                        status={bootstrapStatus.status as 'healthy' | 'warning' | 'critical'}
                    />
                    <StatusCard
                        icon="⚽"
                        label="Player Stats"
                        percentage={playerStatsStatus.value}
                        status={playerStatsStatus.status as 'healthy' | 'warning' | 'critical'}
                    />
                    <StatusCard
                        icon="🎯"
                        label="Draft Data"
                        percentage={draftDataStatus.value}
                        status={draftDataStatus.status as 'healthy' | 'warning' | 'critical'}
                    />
                </AdminGrid>
            </AdminSection>

            <QuickActionsSection cacheData={cacheData} />

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
                        fetcher={clearDatafetcher}
                    />
                    <ActionCard
                        title="Clear FPL Data"
                        description="Clear FPL bootstrap + elements"
                        buttonText="Clear FPL"
                        actionType="clearFirestoreData"
                        onExecute={(actionType) => executeAction(actionType, 'fpl-only')}
                        fetcher={clearDatafetcher}
                    />
                    <ActionCard
                        title="Clear Everything"
                        description="Clear everything (nuclear option)"
                        buttonText="Clear All"
                        actionType="clearFirestoreData"
                        onExecute={(actionType) => executeAction(actionType, 'all')}
                        fetcher={clearDatafetcher}
                    />
                </AdminGrid>
            </AdminSection>
        </AdminContainer>
    );
};
