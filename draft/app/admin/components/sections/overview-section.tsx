import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { StatusCard } from '../ui/status-card';
import { AdminSection, AdminGrid, AdminContainer } from '../layout';
import { QuickActionsSection } from './quick-actions-section';

export const OverviewSection = () => {
    const fetcher = useFetcher();
    const { cacheData } = fetcher.data || {};

    console.log(fetcher, cacheData)
    // Fetch cache data when component mounts
    React.useEffect(() => {
        if (fetcher.state === 'idle' && !fetcher.data) {
            fetcher.submit({ actionType: 'getFirestoreStats' }, { method: 'post' });
        }
    }, [fetcher]);

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
                        percentage={cacheData?.hasBootstrapData ? "✓" : "..."}
                        status={cacheData?.hasBootstrapData ? "healthy" : "warning"}
                    />
                    <StatusCard
                        icon="⚽"
                        label="Player Stats"
                        percentage={cacheData?.hasElementSummaries ? "✓" : "..."}
                        status={cacheData?.hasElementSummaries ? "healthy" : "warning"}
                    />
                    <StatusCard
                        icon="🎯"
                        label="Draft Data"
                        percentage={cacheData?.hasEnhancedData ? "Ready" : "Pending"}
                        status={cacheData?.hasEnhancedData ? "healthy" : "warning"}
                    />
                </AdminGrid>
            </AdminSection>

            <QuickActionsSection cacheData={cacheData} />
        </AdminContainer>
    );
};
