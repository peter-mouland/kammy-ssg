
// /admin/components/sections/data-management-section.tsx
import React from 'react';
import { useFetcher } from 'react-router';
import * as Icons from '../components/admin-icons';
import { ActionCard } from '../components/action-card';
import { CacheStatusDisplay } from '../components/cache-status-display';
import styles from './data-management-section.module.css';

interface DataManagementSectionProps {
    expandedSections: Set<string>;
    toggleSection: (section: string) => void;
}

export const DataManagementSection = ({
                                          expandedSections,
                                          toggleSection
                                      }: DataManagementSectionProps) => {
    const fetcher = useFetcher();

    const executeAction = (actionType: string, variant?: string) => {
        const payload: any = { actionType };
        if (variant) payload.variant = variant;
        fetcher.submit(payload, { method: 'post' });
    };

    return (
        <div className={styles.dataManagementContainer}>
            {/* Cache Status Display */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Icons.DatabaseIcon />
                        Cache Status
                    </h2>
                </div>
                <div className={styles.sectionContent}>
                    <CacheStatusDisplay />
                </div>
            </div>

            {/* Cache Management - Collapsible */}
            <div className={styles.section}>
                <div
                    className={styles.collapsibleHeader}
                    onClick={() => toggleSection('cache-management')}
                >
                    <h2 className={styles.collapsibleTitle}>
                        <Icons.TrashIcon />
                        Manual Cache Clearing
                    </h2>
                    <Icons.ChevronIcon expanded={expandedSections.has('cache-management')} />
                </div>
                <div className={`${styles.collapsibleContent} ${
                    expandedSections.has('cache-management') ? styles.expanded : ''
                }`}>
                    <div className={styles.sectionContent}>
                        <div className={styles.actionGrid}>
                            <ActionCard
                                title="Clear Player Summaries"
                                description="Clear player summaries only (fastest)"
                                buttonText="Clear Elements"
                                actionType="clearFirestoreData"
                                onExecute={(actionType) => executeAction(actionType, 'elements-only')}
                                fetcher={fetcher}
                            />
                            <ActionCard
                                title="Clear FPL Data"
                                description="Clear FPL bootstrap + elements"
                                buttonText="Clear FPL"
                                actionType="clearFirestoreData"
                                onExecute={(actionType) => executeAction(actionType, 'fpl-only')}
                                fetcher={fetcher}
                            />
                            <ActionCard
                                title="Clear Everything"
                                description="Clear everything (nuclear option)"
                                buttonText="Clear All"
                                actionType="clearFirestoreData"
                                onExecute={(actionType) => executeAction(actionType, 'all')}
                                fetcher={fetcher}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
