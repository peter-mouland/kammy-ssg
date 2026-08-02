// app/admin/components/sections/gameweek-processing-section.tsx

import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
import { describeGameweekAvailability } from '../../../_shared/lib/gameweek-availability';
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

export function GameweekProcessingSection({ systemStatus, sharedContext }: GameweekProcessingSectionProps) {
    const fetcher = useFetcher();

    // Progress modal state
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);

    const isLoading = fetcher.state !== 'idle';
    const actionData = fetcher.data;

    // There is not always a current gameweek, and this section is exactly where an admin
    // lands when there isn't -- an empty database and a pre-season FPL calendar both produce
    // it. Reading `.fplEvent.id` straight off it crashed the page in that state, which hid
    // the one control that fixes it.
    const currentGameweekData = systemStatus.gameweekProcessing.currentGameweek;
    const availability = describeGameweekAvailability(sharedContext?.fplData?.events, currentGameweekData);

    const currentGameweek = currentGameweekData?.fplEvent?.id ?? 0;
    const lastProcessedGameweek = systemStatus.gameweekProcessing.lastProcessedGameweek;
    const needsProcessing = availability.available && currentGameweek > lastProcessedGameweek;

    // Check if bootstrap was run during the current gameweek
    const currentGameweekStart = currentGameweekData?.start;
    const bootstrapLastUpdated = systemStatus.bootstrapLastUpdated ? new Date(systemStatus.bootstrapLastUpdated) : null;
    const bootstrapRecommended =
        !bootstrapLastUpdated || !currentGameweekStart || bootstrapLastUpdated < new Date(currentGameweekStart);

    const handleCacheAction = (actionType: string) => {
        const formData = new FormData();
        formData.append('actionType', actionType);

        // Submit to the parent admin route, not the current nested route
        fetcher.submit(formData, {
            method: 'POST',
            action: '/admin', // This ensures we hit the parent route's action
        });
    };

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
                        {availability.available ? (
                            needsProcessing ? (
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
                            )
                        ) : (
                            <AdminMessage type="warning">{availability.title}</AdminMessage>
                        )}
                    </ActionBar>
                }
            >
                {availability.available ? null : <p>{availability.detail}</p>}
                <AdminGrid columns="auto" minWidth="250px">
                    <StatusCard
                        icon="📅"
                        label="Current Gameweek"
                        percentage={availability.available ? `Gameweek ${currentGameweek}` : 'None'}
                        status={availability.available ? 'healthy' : 'warning'}
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
                <AdminButton
                    variant={bootstrapRecommended ? 'primary' : 'secondary'}
                    disabled={isLoading}
                    onClick={() => handleCacheAction('populateBootstrapData')}
                    icon={bootstrapRecommended ? '⭐' : undefined}
                >
                    Populate Bootstrap Data
                    {bootstrapRecommended && ' (Recommended)'}
                </AdminButton>
                <br />
                {bootstrapRecommended && (
                    <p>
                        Bootstrap data refresh recommended when starting a new gameweek to get latest player prices and
                        team updates
                    </p>
                )}
                <br />
                <hr />
                <br />
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
                        icon={<Icons.RefreshIcon />}
                        variant="danger"
                        onClick={() => handleProcessGameweek('gameweeks', lastProcessedGameweek)}
                        disabled={isLoading || lastProcessedGameweek === currentGameweek}
                        loading={isLoading}
                    >
                        Regenerate Points {lastProcessedGameweek}+
                    </AdminButton>

                    <AdminButton
                        icon={<Icons.RefreshIcon />}
                        variant="secondary"
                        onClick={() => handleProcessGameweek('gameweek', currentGameweek - 1)}
                        disabled={isLoading || currentGameweek <= 1}
                        loading={isLoading}
                    >
                        Regenerate Last Gameweek
                    </AdminButton>

                    <AdminButton
                        variant="primary"
                        onClick={() => handleProcessGameweek('gameweek', currentGameweek)}
                        disabled={isLoading || !availability.available}
                        loading={isLoading}
                        icon={'▶️'}
                    >
                        {availability.available ? `Run Gameweek ${currentGameweek}` : 'Run Gameweek'}
                    </AdminButton>
                    {/* The `$` was literal: an admin read "Error: ${the actual message}". */}
                    {actionData?.error && <AdminMessage type="error">Error: {actionData.error}</AdminMessage>}
                    {actionData?.success && actionData.message && (
                        <AdminMessage type="success">{actionData.message}</AdminMessage>
                    )}
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
