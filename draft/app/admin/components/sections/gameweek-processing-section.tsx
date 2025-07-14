// app/admin/components/sections/gameweek-processing-section.tsx

import { useEffect, useState } from 'react';
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
import { ProgressModal } from '../ui/progress-modal';
import { StatusCard } from '../ui/status-card';

interface GameweekProcessingSectionProps {
    systemStatus: SystemStatusSummary;
    sharedContext: AdminDataContext;
}

export function GameweekProcessingSection({ systemStatus }: GameweekProcessingSectionProps) {
    const fetcher = useFetcher();

    // Progress modal state
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);

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
            action: '/admin',
        });
    };

    // Replace the inline if statement with useEffect:
    useEffect(() => {
        if (actionData?.jobId && !currentJobId && !showProgressModal) {
            console.log('🔍 Setting up progress modal for jobId:', actionData.jobId);
            setCurrentJobId(actionData.jobId);
            setShowProgressModal(true);
            // Clear the fetcher data to prevent re-triggering
            fetcher.data = null;
        }
    }, [actionData?.jobId, currentJobId, showProgressModal]);

    return (
        <AdminContainer>
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
                            <AdminMessage type="success">All gameweeks up to date</AdminMessage>
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
                        icon="🔄"
                        label="Transfers"
                        percentage={`${systemStatus.transfers.pending} pending`}
                        status={systemStatus.transfers.pending > 0 ? 'warning' : 'healthy'}
                    />
                    <StatusCard
                        icon="⚡"
                        label="Processing Status"
                        percentage={needsProcessing ? `${lastProcessedGameweek + 1} Needs Processing` : 'Up to Date'}
                        status={needsProcessing ? 'warning' : 'healthy'}
                    />
                </AdminGrid>
            </AdminSection>
            <AdminSection title="Gameweek Processing: Actions" icon={<Icons.ChartIcon />}>
                <AdminGrid columns="auto" minWidth="250px">
                    <AdminButton
                        icon={<Icons.RefreshIcon />}
                        variant="danger"
                        onClick={() => handleProcessGameweek('all')}
                        disabled={isLoading}
                    >
                        Regenerate All Points
                    </AdminButton>

                    <AdminButton
                        variant="secondary"
                        onClick={() => handleProcessGameweek('gameweek', currentGameweek - 1)}
                        disabled={isLoading || currentGameweek <= 1}
                        icon={'↩️'}
                    >
                        Regenerate Last Gameweek
                    </AdminButton>

                    <AdminButton
                        variant="primary"
                        onClick={() => handleProcessGameweek('gameweek', currentGameweek)}
                        disabled={isLoading}
                        icon={'▶️'}
                    >
                        Run Gameweek {currentGameweek}
                    </AdminButton>
                    {actionData?.error && <AdminMessage type="error">Error: ${actionData.error}</AdminMessage>}
                </AdminGrid>
            </AdminSection>

            <ProgressModal
                isOpen={showProgressModal}
                jobId={currentJobId}
                onClose={() => {
                    setShowProgressModal(false);
                    setCurrentJobId(null);
                }}
                onComplete={() => {
                    setTimeout(() => window.location.reload(), 1000);
                }}
                onError={(update) => {
                    console.error('Progress error:', update);
                }}
            />
        </AdminContainer>
    );
}
