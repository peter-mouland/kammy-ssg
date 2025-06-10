
// /admin/components/sections/draft-section.tsx
import React from 'react';
import { useActionData, useFetcher } from 'react-router';
import * as Icons from '../components/admin-icons';
import { DraftCard } from '../components/draft-card';
import { FirebaseSyncSection } from './firebase-sync-section';
import styles from './draft-section.module.css';

interface DraftSectionProps {
    divisions: any[];
    draftOrders: Record<string, any[]>;
    userTeamsByDivision: Record<string, any[]>;
    draftState: any;
}

export const DraftSection = ({
                                 divisions,
                                 draftOrders,
                                 userTeamsByDivision,
                                 draftState
                             }: DraftSectionProps) => {
    const actionData = useActionData();

    return (
        <div className={styles.draftContainer}>
            {/* Draft Management */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Icons.UsersIcon />
                        Draft Management
                    </h2>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.divisionGrid}>
                        {divisions.map((division) => (
                            <DraftCard
                                key={division.id}
                                division={division}
                                teams={userTeamsByDivision[division.id] || []}
                                orders={draftOrders[division.id] || []}
                                draftState={draftState}
                            />
                        ))}
                    </div>

                    {/* Action Messages */}
                    {actionData && (
                        <div className={styles.actionMessages}>
                            {actionData.success && actionData.message && (
                                <div className={styles.successMessage}>
                                    ✅ {actionData.message}
                                </div>
                            )}
                            {actionData.error && (
                                <div className={styles.errorMessage}>
                                    ❌ {actionData.error}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Firebase + GSheets Sync */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Icons.SyncIcon />
                        Firebase + GSheets Sync
                    </h2>
                    <p className={styles.actionDescription}>
                        If the GSheet was manually changed (e.g. a drafted player remove), we will need to sync
                    </p>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.warningMessage}>
                        💡 <strong>Tip:</strong> Use this after manually editing picks in sheets or if Firebase shows wrong turn/state.
                    </div>
                    <div className={styles.syncWrapper}>
                        <FirebaseSyncSection />
                    </div>
                </div>
            </div>
        </div>
    );
};
