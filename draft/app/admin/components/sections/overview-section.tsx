/* Location: app/admin/components/sections/overview-section.tsx */

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
import styles from './overview-section.module.css';

interface OverviewSectionProps {
    systemStatus: SystemStatusSummary;
    sharedContext: AdminDataContext;
    expandedSections: Set<string>;
    toggleSection: (section: string) => void;
}

export function OverviewSection({ systemStatus, sharedContext }: OverviewSectionProps) {
    const fetcher = useFetcher();

    const isLoading = fetcher.state !== 'idle';
    const actionData = fetcher.data;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return '✅';
            case 'warning':
                return '⚠️';
            case 'critical':
                return '❌';
            default:
                return '❓';
        }
    };

    return (
        <AdminContainer>
            {/* System Health Overview */}
            <AdminSection
                title="System Health"
                icon={<Icons.BarChartIcon />}
                description="Monitor system status and data availability"
                actions={
                    <ActionBar align="right" gap="md">
                        <div className={styles.statusIndicator}>
                            {getStatusIcon(systemStatus.systemHealth.overall.status)}{' '}
                            {systemStatus.systemHealth.overall.status}
                        </div>
                    </ActionBar>
                }
            >
                <AdminGrid columns="auto" minWidth="250px">
                    <StatusCard
                        icon="🎯"
                        label="Draft Management"
                        percentage={systemStatus.draft.stage}
                        status={
                            systemStatus.draft.stage === 'start'
                                ? 'critical'
                                : systemStatus.draft.stage === 'running'
                                  ? 'warning'
                                  : systemStatus.draft.isComplete
                                    ? 'healthy'
                                    : 'warning'
                        }
                    />
                    <StatusCard
                        icon="⚽"
                        label="Transfers"
                        percentage={`${systemStatus.transfers.pending} pending`}
                        status={systemStatus.transfers.pending > 0 ? 'warning' : 'healthy'}
                    />
                    <StatusCard
                        icon="📊"
                        label="Gameweek Processing"
                        percentage={
                            systemStatus.gameweekProcessing.lastProcessedGameweek ===
                            systemStatus.currentGameweek.fplEvent.id
                                ? `GW ${systemStatus.currentGameweek.fplEvent.id} processed`
                                : `GW ${systemStatus.currentGameweek.fplEvent.id} needs processing`
                        }
                        status={
                            systemStatus.gameweekProcessing.lastProcessedGameweek ===
                            systemStatus.currentGameweek.fplEvent.id
                                ? 'healthy'
                                : 'warning'
                        }
                    />
                    <StatusCard
                        icon="🗄️"
                        label="Cache Health"
                        percentage={`${sharedContext.cacheStatus.completionPercentage}%`}
                        status={sharedContext.cacheStatus.health}
                    />
                </AdminGrid>
            </AdminSection>

            <AdminSection
                title="Recommended Actions"
                icon={<Icons.AlertIcon />}
                description="System has detected issues that can be automatically resolved"
            >
                <ul className={styles.recommendedActions}>
                    {systemStatus.recommendations.map((rec) => (
                        <li className={styles.actionItem} key={rec}>
                            <div className={styles.actionContent}>{rec}</div>
                        </li>
                    ))}
                </ul>
            </AdminSection>

            {/* Action Messages */}
            {actionData?.success && actionData.message && (
                <AdminMessage type="success">{actionData.message}</AdminMessage>
            )}
            {actionData?.error && <AdminMessage type="error">{actionData.error}</AdminMessage>}

            {/* Quick Stats */}
            <AdminSection title="Quick Stats" icon={<Icons.DatabaseIcon />} description="Current system data overview">
                <AdminGrid columns="auto" minWidth="200px">
                    <StatusCard
                        icon="🏆"
                        label="Divisions"
                        percentage={sharedContext.sheetData.divisions.length.toString()}
                        status="healthy"
                    />
                    <StatusCard
                        icon="👥"
                        label="Managers"
                        percentage={sharedContext.sheetData.managers.length.toString()}
                        status="healthy"
                    />
                    <StatusCard
                        icon="⚽"
                        label="Players"
                        percentage={sharedContext.fplData.players.length.toString()}
                        status="healthy"
                    />
                    <StatusCard
                        icon="📅"
                        label="Current Gameweek"
                        percentage={systemStatus.currentGameweek.fplEvent.id.toString()}
                        status="healthy"
                    />
                </AdminGrid>
            </AdminSection>

            {/* System Messages */}

            {/* Data Freshness Info */}
            <AdminSection
                title="Data Freshness"
                icon={<Icons.ClockIcon />}
                description="When data was last loaded and cached"
            >
                <div className={styles.dataFreshness}>
                    <div className={styles.freshnessItem}>
                        <strong>System Data Loaded:</strong> {new Date(sharedContext.loadedAt).toLocaleString()}
                    </div>
                    <div className={styles.freshnessItem}>
                        <strong>Cache Last Updated:</strong>{' '}
                        {sharedContext.cacheStatus.lastUpdated
                            ? new Date(sharedContext.cacheStatus.lastUpdated).toLocaleString()
                            : 'Never'}
                    </div>
                    <div className={styles.freshnessItem}>
                        <strong>FPL Data Status:</strong> {sharedContext.fplData.players.length} players loaded
                    </div>
                </div>
            </AdminSection>
        </AdminContainer>
    );
}
