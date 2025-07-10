/* Location: app/admin/components/sections/settings-section.tsx */

import React, { useState } from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { AdminContainer } from '../layout/admin-container';
import { AdminGrid } from '../layout/admin-grid';
import { AdminSection } from '../layout/admin-section';
import { ActionCard } from '../ui/action-card';
import styles from './settings-section.module.css';

export const SettingsSection = () => {
    const [selectedCacheKey, setSelectedCacheKey] = useState('');
    const clearDataFetcher = useFetcher();

    const isLoading = clearDataFetcher.state === 'submitting';
    const actionResult = clearDataFetcher.data;

    const onExecuteAction = (actionType: string, variant?: string) => {
        const formData = new FormData();
        formData.append('actionType', actionType);
        formData.append('variant', variant || 'all');
        clearDataFetcher.submit(formData, {
            method: 'post',
            action: '?index', // Submit to the index route, not parent
        });
    };

    // Common cache keys for quick selection
    const commonCacheKeys = [
        'fpl:players',
        'fpl:teams',
        'fpl:events',
        'sheets:divisions',
        'sheets:managers',
        'sheets:draft-state',
        'sheets:draft-orders',
        'sheets:draft-picks',
        'sheets:players',
        'firebase:cache-status',
    ];

    return (
        <AdminContainer>
            <AdminSection
                title="Cache Management & Debug"
                icon={<Icons.SettingsIcon />}
                collapsible={false}
                expanded={true}
            >
                {/* Cache Key Selection */}
                <div className={styles.cacheKeySelector}>
                    <h4>Specific Cache Management</h4>
                    <div className={styles.keySelection}>
                        <select
                            value={selectedCacheKey}
                            onChange={(e) => setSelectedCacheKey(e.target.value)}
                            className={styles.selectInput}
                        >
                            <option value="">Select cache key...</option>
                            {commonCacheKeys.map((key) => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className={`${styles.actionButton} ${styles.secondary} ${styles.small}`}
                            onClick={() => onExecuteAction('invalidateSpecificCache', { cacheKey: selectedCacheKey })}
                            disabled={isLoading || !selectedCacheKey}
                        >
                            <Icons.AlertIcon />
                            Invalidate Selected
                        </button>
                    </div>
                </div>
            </AdminSection>

            <AdminSection title="Cache Actions" icon={<Icons.SettingsIcon />} collapsible={false} expanded={true}>
                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => onExecuteAction('refreshCache')}
                    disabled={isLoading}
                >
                    <Icons.RefreshIcon />
                    Refresh Admin Cache
                </button>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.warning}`}
                    onClick={() => onExecuteAction('clearCache')}
                    disabled={isLoading}
                >
                    <Icons.AlertIcon />
                    Clear All Cache
                </button>

                <h3 className={styles.sectionTitle}>Debug Actions</h3>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => window.open('/api/cache?action=status', '_blank')}
                    disabled={isLoading}
                >
                    <Icons.FileIcon />
                    View Cache Statistics
                </button>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => window.open('/api/cache?action=keys', '_blank')}
                    disabled={isLoading}
                >
                    <Icons.DatabaseIcon />
                    View All Cache Keys
                </button>
            </AdminSection>

            <AdminSection
                title="Manual Database Clearing"
                icon={<Icons.TrashIcon />}
                collapsible={true}
                expanded={true}
            >
                <AdminGrid columns="auto" minWidth="250px">
                    <ActionCard
                        title="Clear Player Detailed Stats"
                        description="Clear player summaries only"
                        buttonText="Clear Elements"
                        actionType="clearFirestoreData"
                        onExecute={(actionType) => onExecuteAction(actionType, 'elements-only')}
                        fetcher={clearDataFetcher}
                    />
                    <ActionCard
                        title="Clear FPL Data"
                        description="Clear FPL events + elements"
                        buttonText="Clear FPL"
                        actionType="clearFirestoreData"
                        onExecute={(actionType) => onExecuteAction(actionType, 'fpl-only')}
                        fetcher={clearDataFetcher}
                    />
                    <ActionCard
                        title="Clear Everything"
                        description="Nuclear option"
                        buttonText="Clear All"
                        actionType="clearFirestoreData"
                        onExecute={(actionType) => onExecuteAction(actionType, 'all')}
                        fetcher={clearDataFetcher}
                    />
                </AdminGrid>
            </AdminSection>
        </AdminContainer>
    );
};
