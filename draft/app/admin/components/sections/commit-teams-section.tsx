// /admin/components/sections/commit-teams-section.tsx
import type React from 'react';
import { useState } from 'react';
import { useActionData } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { AdminSection } from '../layout';
import { AdminMessage } from '../ui/admin-message';
import { CommitTeamsButton } from '../ui/commit-teams-button';
import styles from './commit-teams-section.module.css';

interface CommitTeamsSectionProps {
    divisions: any[];
    draftOrders: Record<string, any[]>;
    userTeamsByDivision: Record<string, any[]>;
    draftState: any;
}

export const CommitTeamsSection: React.FC<CommitTeamsSectionProps> = ({
    divisions,
    draftOrders,
    userTeamsByDivision,
    draftState,
}) => {
    const [selectedDivision, setSelectedDivision] = useState<string>('');
    const actionData = useActionData();

    // Get division info for selected division
    const selectedDivisionData = divisions.find((d) => d.id === selectedDivision);
    const selectedTeams = userTeamsByDivision[selectedDivision]?.length || 0;

    // For now, disable pick validation to avoid API calls
    // TODO: Add draft picks count when we have better caching
    const isDraftActive = draftState?.isActive && draftState?.currentDivisionId === selectedDivision;
    const isComplete = !isDraftActive; // Assume complete if not active
    const isReadyToCommit = selectedDivision && selectedTeams > 0;

    return (
        <AdminSection
            title="Commit Teams to Firestore"
            icon={<Icons.DatabaseIcon />}
            description="After draft completion, commit all drafted teams to Firestore for the live game"
        >
            <AdminMessage type="info">
                <strong>Important:</strong> Only commit teams after the draft is completely finished. This will create
                the team structure needed for the live fantasy game.
            </AdminMessage>

            <div className={styles.formContainer}>
                {/* Division Selection */}
                <div className={styles.divisionSelector}>
                    <label htmlFor="commitDivision" className={styles.label}>
                        Select Division to Commit:
                    </label>
                    <select
                        id="commitDivision"
                        value={selectedDivision}
                        onChange={(e) => setSelectedDivision(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">-- Select Division --</option>
                        {divisions.map((division) => (
                            <option key={division.id} value={division.id}>
                                {division.name || `Division ${division.id}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Division Status */}
                {selectedDivision && (
                    <div className={styles.statusCard}>
                        <h4 className={styles.statusTitle}>
                            Division Status: {selectedDivisionData?.name || selectedDivision}
                        </h4>
                        <div className={styles.statusGrid}>
                            <div className={styles.statusItem}>
                                <span className={styles.statusLabel}>Teams:</span>
                                <span className={styles.statusValue}>{selectedTeams}</span>
                            </div>
                            <div className={styles.statusItem}>
                                <span className={styles.statusLabel}>Draft Status:</span>
                                <span
                                    className={`${styles.statusValue} ${isComplete ? styles.statusComplete : styles.statusInProgress}`}
                                >
                                    {isDraftActive ? '⏳ Active' : '✅ Ready to Commit'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Warning for active drafts */}
                {selectedDivision && isDraftActive && (
                    <AdminMessage type="warning">
                        Draft is still active for this division. Complete the draft before committing teams.
                    </AdminMessage>
                )}

                {/* Commit Button */}
                <div className={styles.buttonContainer}>
                    <CommitTeamsButton divisionId={selectedDivision} disabled={!isReadyToCommit} variant="primary" />
                </div>
            </div>

            {/* Success/Error Messages */}
            {actionData?.success && actionData.message && (
                <AdminMessage type="success">
                    {actionData.message}
                    {actionData.data && (
                        <div className={styles.successDetails}>
                            {actionData.data.teamsCount} teams • {actionData.data.playersCount} players committed
                        </div>
                    )}
                </AdminMessage>
            )}
            {actionData?.error && <AdminMessage type="error">{actionData.error}</AdminMessage>}
        </AdminSection>
    );
};
