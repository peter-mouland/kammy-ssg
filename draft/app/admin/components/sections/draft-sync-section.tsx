/* Location: app/admin/components/sections/draft-sync-section.tsx */

// /admin/components/sections/draft-sync-section.tsx
import type React from 'react';
import { useState } from 'react';
import { useActionData, useFetcher } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { AdminSection } from '../layout/admin-section';
import { AdminMessage } from '../ui/admin-message';
import { ResetDraftButton } from '../ui/reset-draft-button';
import styles from './draft-sync-section.module.css';

interface DraftSyncSectionProps {
    divisions: any[];
    draftState: any;
}

export const DraftSyncSection: React.FC<DraftSyncSectionProps> = ({ divisions, draftState }) => {
    const [selectedDivision, setSelectedDivision] = useState<string>('');
    const actionData = useActionData();

    const selectedDivisionData = divisions.find((d) => d.id === selectedDivision);

    return (
        <AdminSection
            title="Draft Firebase Sync"
            icon={<Icons.RefreshIcon />}
            description="Sync draft data between Google Sheets and Firebase. Use Reset when normal sync fails."
        >
            <AdminMessage type="info">
                <strong>Sync vs Reset:</strong>
                <br />• <strong>Sync</strong>: Updates Firebase with current Google Sheets data (recommended)
                <br />• <strong>Reset</strong>: Completely clears Firebase and rebuilds from sheets (use when sync
                fails)
            </AdminMessage>

            <div className={styles.syncControls}>
                {/* Division Selection */}
                <div className={styles.divisionSelect}>
                    <label htmlFor="sync-division-select" className={styles.label}>
                        Select Division:
                    </label>
                    <select
                        id="sync-division-select"
                        value={selectedDivision}
                        onChange={(e) => setSelectedDivision(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">Choose a division...</option>
                        {divisions.map((division) => (
                            <option key={division.id} value={division.id}>
                                {division.name} ({division.id})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Division Info */}
                {selectedDivision && selectedDivisionData && (
                    <div className={styles.divisionInfo}>
                        <h4>Division: {selectedDivisionData.name}</h4>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Status:</span>
                                <span
                                    className={
                                        draftState?.isActive && draftState?.currentDivisionId === selectedDivision
                                            ? styles.statusActive
                                            : styles.statusInactive
                                    }
                                >
                                    {draftState?.isActive && draftState?.currentDivisionId === selectedDivision
                                        ? '🟢 Active'
                                        : '⚪ Inactive'}
                                </span>
                            </div>
                            {draftState?.currentDivisionId === selectedDivision && (
                                <>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Current Pick:</span>
                                        <span>{draftState.currentPick}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Current User:</span>
                                        <span>{draftState.currentUserId}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className={styles.actionButtons}>
                    <SyncDraftButton divisionId={selectedDivision} disabled={!selectedDivision} variant="primary" />

                    <ResetDraftButton divisionId={selectedDivision} disabled={!selectedDivision} variant="danger" />
                </div>

                {/* Warning for Reset */}
                {selectedDivision && (
                    <AdminMessage type="warning">
                        <strong>When to use Reset:</strong> Only use "Reset Draft" if normal sync isn't working, such as
                        when you've manually edited the Google Sheets and Firebase is out of sync. Reset will completely
                        clear all Firebase draft data and rebuild it from scratch.
                    </AdminMessage>
                )}
            </div>

            {/* Success/Error Messages */}
            {actionData?.success && actionData.message && (
                <AdminMessage type="success">
                    {actionData.message}
                    {actionData.data?.resetPerformed && (
                        <div className={styles.resetSuccess}>
                            <strong>✅ Complete Reset Performed</strong> - All Firebase data cleared and rebuilt from
                            Google Sheets
                        </div>
                    )}
                </AdminMessage>
            )}
            {actionData?.error && <AdminMessage type="error">{actionData.error}</AdminMessage>}
        </AdminSection>
    );
};

// Sync Draft Button Component
interface SyncDraftButtonProps {
    divisionId: string;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
}

const SyncDraftButton: React.FC<SyncDraftButtonProps> = ({ divisionId, disabled = false, variant = 'primary' }) => {
    const fetcher = useFetcher();

    const isLoading = fetcher.state === 'submitting';
    const isDisabled = disabled || isLoading || !divisionId;

    const handleSyncDraft = () => {
        if (isDisabled) return;

        fetcher.submit(
            {
                actionType: 'syncDraft',
                divisionId,
            },
            { method: 'post' },
        );
    };

    return (
        <button
            type="button"
            onClick={handleSyncDraft}
            disabled={isDisabled}
            className={`${styles.syncButton} ${styles[variant]} ${isDisabled ? styles.disabled : ''}`}
            title={isDisabled ? 'Select a division first' : 'Sync draft data from Google Sheets to Firebase'}
        >
            {isLoading ? (
                <>
                    <Icons.RefreshIcon />
                    Syncing...
                </>
            ) : (
                <>
                    <Icons.SyncIcon />
                    Sync Draft
                </>
            )}
        </button>
    );
};
