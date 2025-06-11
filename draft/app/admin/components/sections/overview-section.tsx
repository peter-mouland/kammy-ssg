// /admin/components/sections/overview-section.tsx
import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { StatusCard } from '../ui/status-card';
import { AdminSection, AdminGrid, AdminContainer } from '../layout';
import { QuickActionsSection } from './quick-actions-section';

export const OverviewSection = () => {
    const fetcher = useFetcher();
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

        const hasEnhanced = (cacheData.hasEnhancedData) > 0;
        return {
            status: hasEnhanced ? 'healthy' : 'warning',
            value: hasEnhanced ? 'Ready' : 'Pending'
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
        </AdminContainer>
    );
};
