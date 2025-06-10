// /admin/components/sections/overview-section.tsx
import React from 'react';
import { useFetcher, useLoaderData } from 'react-router';
import * as Icons from '../components/admin-icons';
import { StatusCard } from '../components/status-card';
import { QuickActionsSection } from './quick-actions-section';
import styles from './overview-section.module.css';

export const OverviewSection = () => {
    const fetcher = useFetcher();
    const { cacheData } = fetcher.data || {};

    // Fetch cache data when component mounts
    React.useEffect(() => {
        if (fetcher.state === 'idle' && !fetcher.data) {
            fetcher.submit({ actionType: 'getFirestoreStats' }, { method: 'post' });
        }
    }, [fetcher]);

    return (
        <div className={styles.overviewContainer}>
            {/* System Overview */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Icons.BarChartIcon />
                        System Overview
                    </h2>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.statusGrid}>
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
                    </div>
                </div>
            </div>

            <QuickActionsSection cacheData={cacheData} />
        </div>
    );
};



