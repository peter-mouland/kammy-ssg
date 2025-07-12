/* Location: app/admin/components/sections/gameweek-processing-section.tsx */

import { useFetcher } from 'react-router';
import type { AdminDataContext } from '../../types/admin-orchestrator-types';
import type { SystemStatusSummary } from '../../types/admin-types';
import * as Icons from '../icons/admin-icons';
import { ActionBar } from '../layout/action-bar';
import { AdminContainer } from '../layout/admin-container';
import { AdminGrid } from '../layout/admin-grid';
import { AdminSection } from '../layout/admin-section';
import { AdminButton } from '../ui/admin-button';
import { AdminMessage } from '../ui/admin-message';
import { StatusCard } from '../ui/status-card';
import styles from './gameweek-processing-section.module.css';

interface GameweekProcessingSectionProps {
    systemStatus: SystemStatusSummary;
    sharedContext: AdminDataContext;
}

export function GameweekProcessingSection({ systemStatus }: GameweekProcessingSectionProps) {
    const fetcher = useFetcher();

    const isLoading = fetcher.state !== 'idle';
    const actionData = fetcher.data;

    const currentGameweek = systemStatus.gameweekProcessing.currentGameweek.fplEvent.id;
    const lastProcessedGameweek = systemStatus.gameweekProcessing.lastProcessedGameweek;
    const needsProcessing = currentGameweek > lastProcessedGameweek;

    const handleProcessGameweek = (type: string, gameweek?: number) => {
        const formData = new FormData();
        formData.append('actionType', 'processGameweek');
        formData.append('gameweekAction', type);
        if (gameweek) formData.append('gameweek', gameweek.toString());

        fetcher.submit(formData, {
            method: 'POST',
            action: '/admin', // Submit to parent route
        });
    };

    return (
        <AdminContainer>
            {/* Main Gameweek Processing */}
            <AdminSection
                title="Gameweek Processing"
                icon={<Icons.ChartIcon />}
                description="End-to-end gameweek workflow management"
                actions={
                    <ActionBar align="right">
                        {needsProcessing ? (
                            <AdminButton
                                variant="primary"
                                onClick={() => handleProcessGameweek('gameweek', currentGameweek)}
                                disabled={isLoading}
                                loading={isLoading}
                            >
                                Process Gameweek {currentGameweek}
                            </AdminButton>
                        ) : (
                            <div className={styles.statusBadge + ' ' + styles.success}>
                                ✅ Gameweek {currentGameweek} Processed
                            </div>
                        )}
                    </ActionBar>
                }
            >
                <AdminGrid columns="auto" minWidth="250px">
                    <StatusCard
                        icon="📅"
                        label="Current Gameweek"
                        percentage={`Gameweek ${currentGameweek}`}
                        status="healthy"
                    />
                    <StatusCard
                        icon="⚡"
                        label="Processing Status"
                        percentage={needsProcessing ? 'Needs Processing' : 'Up to Date'}
                        status={needsProcessing ? 'warning' : 'healthy'}
                    />
                    <StatusCard
                        icon="🔄"
                        label="Transfers"
                        percentage={`${systemStatus.transfers.pending} pending`}
                        status={systemStatus.transfers.pending > 0 ? 'warning' : 'healthy'}
                    />
                    <StatusCard
                        icon="📊"
                        label="Points Calculated"
                        percentage={`Up to GW ${lastProcessedGameweek}`}
                        status={needsProcessing ? 'warning' : 'healthy'}
                    />
                </AdminGrid>

                {/* Processing Overview */}
                <div className={styles.processingOverview}>
                    <h4>Gameweek Processing Steps</h4>
                    <div className={styles.processingSteps}>
                        <div className={styles.step}>
                            <span className={styles.stepNumber}>1</span>
                            <div className={styles.stepContent}>
                                <h5>Apply Approved Transfers</h5>
                                <p>Process all approved transfers for the gameweek and update team rosters</p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <span className={styles.stepNumber}>2</span>
                            <div className={styles.stepContent}>
                                <h5>Calculate Points</h5>
                                <p>Generate points for all players based on FPL stats and custom scoring rules</p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <span className={styles.stepNumber}>3</span>
                            <div className={styles.stepContent}>
                                <h5>Update Standings</h5>
                                <p>Recalculate league standings across all divisions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminSection>

            {/* Legacy Actions (for backward compatibility) */}
            <AdminSection
                title="Individual Actions"
                icon={<Icons.SettingsIcon />}
                description="Run specific processing steps individually (for debugging)"
            >
                <AdminGrid columns="auto" minWidth="200px">
                    <AdminButton
                        variant="secondary"
                        onClick={() => handleProcessGameweek('gameweek', currentGameweek - 1)}
                        disabled={isLoading}
                    >
                        Regenerate Last GameWeek
                    </AdminButton>
                    <AdminButton
                        variant="secondary"
                        onClick={() => handleProcessGameweek('gameweek', currentGameweek)}
                        disabled={isLoading}
                    >
                        Regenerate This GameWeek
                    </AdminButton>
                    <AdminButton variant="secondary" onClick={() => handleProcessGameweek('all')} disabled={isLoading}>
                        Regenerate All Points
                    </AdminButton>
                </AdminGrid>
            </AdminSection>

            {/* Action Messages */}
            {actionData?.success && actionData.message && (
                <AdminMessage type="success">{actionData.message}</AdminMessage>
            )}
            {actionData?.error && <AdminMessage type="error">{actionData.error}</AdminMessage>}
        </AdminContainer>
    );
}
