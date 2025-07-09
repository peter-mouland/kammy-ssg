// app/admin/components/tabs/admin-dashboard-tabs.tsx

import type React from 'react';
import { useState } from 'react';
import { useFetcher } from 'react-router';
import type { SystemStatusSummary } from '../../types/admin-types';
import * as Icons from '../icons/admin-icons';
import { AdminContainer } from '../layout/admin-container';
import { AdminGrid } from '../layout/admin-grid';
import { AdminSection } from '../layout/admin-section';
import { AdminMessage } from '../ui/admin-message';
import { StatusCard } from '../ui/status-card';
import styles from './admin-dashboard-tabs.module.css';

interface AdminDashboardTabsProps {
    systemStatus: SystemStatusSummary;
}

type TabId = 'dashboard' | 'data' | 'draft' | 'transfers' | 'gameweek' | 'debug';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    description: string;
}

const TABS: Tab[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <Icons.DatabaseIcon />,
        description: 'Quick health check and most common actions',
    },
    {
        id: 'draft',
        label: 'Draft Management',
        icon: <Icons.UsersIcon />,
        description: 'Draft process administration',
    },
    {
        id: 'transfers',
        label: 'Transfers',
        icon: <Icons.SyncIcon />,
        description: 'Transfer workflow oversight and intervention',
    },
    {
        id: 'gameweek',
        label: 'Gameweek Processing',
        icon: <Icons.ChartIcon />,
        description: 'End-to-end gameweek workflow management',
    },
    {
        id: 'debug',
        label: 'Cache & Debug',
        icon: <Icons.CloudIcon />,
        description: 'Cache management and troubleshooting tools',
    },
];

export const AdminDashboardTabs: React.FC<AdminDashboardTabsProps> = ({ systemStatus }) => {
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const fetcher = useFetcher();

    const executeAction = async (actionType: string, params: Record<string, any> = {}) => {
        console.log(`🎬 Executing action: ${actionType}`, params);
        fetcher.submit({ actionType, ...params }, { method: 'post' });
    };

    const isLoading = fetcher.state === 'submitting';
    const actionResult = fetcher.data;

    return (
        <div className={styles.container}>
            {/* Tab Navigation */}
            <div className={styles.tabNav}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        title={tab.description}
                    >
                        <span className={styles.tabIcon}>{tab.icon}</span>
                        <span className={styles.tabLabel}>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Action Results */}
            {actionResult && (
                <div className={styles.resultBanner}>
                    <AdminMessage type={actionResult.success ? 'success' : 'error'}>
                        {actionResult.message ||
                            (actionResult.success
                                ? 'Action completed successfully'
                                : 'Action failed - check console for details')}
                    </AdminMessage>
                </div>
            )}

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'dashboard' && (
                    <DashboardTab systemStatus={systemStatus} onExecuteAction={executeAction} isLoading={isLoading} />
                )}
                {activeTab === 'draft' && (
                    <DraftManagementTab
                        systemStatus={systemStatus}
                        onExecuteAction={executeAction}
                        isLoading={isLoading}
                    />
                )}
                {activeTab === 'transfers' && (
                    <TransfersManagementTab
                        systemStatus={systemStatus}
                        onExecuteAction={executeAction}
                        isLoading={isLoading}
                    />
                )}
                {activeTab === 'gameweek' && (
                    <GameweekProcessingTab
                        systemStatus={systemStatus}
                        onExecuteAction={executeAction}
                        isLoading={isLoading}
                    />
                )}
                {activeTab === 'debug' && (
                    <CacheDebugTab systemStatus={systemStatus} onExecuteAction={executeAction} isLoading={isLoading} />
                )}
            </div>
        </div>
    );
};

// ================================
// TAB COMPONENTS
// ================================

interface TabProps {
    systemStatus: SystemStatusSummary;
    onExecuteAction: (actionType: string, params?: Record<string, any>) => Promise<void>;
    isLoading: boolean;
}

// ================================
// TAB 1: DASHBOARD / OVERVIEW
// ================================

const DashboardTab: React.FC<TabProps> = ({ systemStatus, onExecuteAction, isLoading }) => {
    return (
        <div className={styles.tabPanel}>
            <AdminContainer>
                <AdminSection
                    title="System Health"
                    icon={<Icons.BarChartIcon />}
                    description="Monitor system status and data availability"
                >
                    <AdminGrid columns="auto" minWidth="200px">
                        <StatusCard
                            icon={
                                systemStatus.systemHealth.overall.status === 'healthy'
                                    ? '✅'
                                    : systemStatus.systemHealth.overall.status === 'warning'
                                      ? '⚠️'
                                      : '❌'
                            }
                            label={`Status: ${systemStatus.systemHealth.overall.status}`}
                            percentage={systemStatus.systemHealth.overall.message}
                            status={systemStatus.systemHealth.overall.status}
                        />
                        <StatusCard
                            icon="🎯"
                            label="1. Draft Management"
                            percentage={`${systemStatus.draft.stage}`}
                            status={'healthy' as 'healthy' | 'warning' | 'critical'}
                        />
                        <StatusCard
                            icon="⚽"
                            label="2. Transfers"
                            percentage={`${systemStatus.transfers.pending} pending`}
                            status={'healthy' as 'healthy' | 'warning' | 'critical'}
                        />
                        <StatusCard
                            icon="📊"
                            label="3. GameWeek Processing"
                            percentage={`GameWeek ${systemStatus.currentGameweek} changed (was ${systemStatus.gameweekProcessing.lastProcessedGameweek}) | `}
                            status={'healthy' as 'healthy' | 'warning' | 'critical'}
                        />
                    </AdminGrid>
                </AdminSection>
            </AdminContainer>

            <div className={styles.overview}>
                <h3 className={styles.sectionTitle}>System Overview</h3>

                {/* Recommendations */}
                <div className={styles.recommendations}>
                    <h4>Recommendations</h4>

                    <button
                        type="button"
                        className={`${styles.actionButton} ${styles.secondary}`}
                        onClick={() => onExecuteAction('smartUpdate')}
                        disabled={isLoading}
                    >
                        <Icons.SyncIcon />
                        Smart Update
                    </button>

                    <ul className={styles.recommendationsList}>
                        {systemStatus.recommendations?.map((rec, index) => (
                            <li key={index}>{rec}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

// ================================
// TAB 3: DRAFT MANAGEMENT
// ================================

const DraftManagementTab: React.FC<TabProps> = ({ systemStatus, onExecuteAction, isLoading }) => {
    return (
        <div className={styles.tabPanel}>
            <div className={styles.overview}>
                <h3 className={styles.sectionTitle}>Draft Management</h3>

                <div className={styles.draftStatus}>
                    <div className={styles.statusCard}>
                        <h4>Draft Status</h4>
                        <div
                            className={`${styles.statusIndicator} ${systemStatus.draft.isActive ? styles.healthy : styles.warning}`}
                        >
                            {systemStatus.draft.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </div>
                        <p>Current GW: {systemStatus.currentGameweek}</p>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <h3 className={styles.sectionTitle}>Draft Actions</h3>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.primary}`}
                    onClick={() => onExecuteAction('processDraft', { divisionId: 'leagueOne', draftAction: 'start' })}
                    disabled={isLoading || systemStatus.draft.isActive}
                >
                    <Icons.PlayIcon />
                    Start Draft
                </button>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => onExecuteAction('processDraft', { divisionId: 'leagueOne', draftAction: 'sync' })}
                    disabled={isLoading || !systemStatus.draft.isActive}
                >
                    <Icons.SyncIcon />
                    Sync Draft to Firebase
                </button>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => onExecuteAction('processDraft', { divisionId: 'leagueOne', draftAction: 'commit' })}
                    disabled={isLoading || !systemStatus.draft.isActive}
                >
                    <Icons.CheckIcon />
                    Commit Draft
                </button>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.warning}`}
                    onClick={() => onExecuteAction('processDraft', { divisionId: 'leagueOne', draftAction: 'reset' })}
                    disabled={isLoading}
                >
                    <Icons.RefreshIcon />
                    Reset Draft
                </button>
            </div>
        </div>
    );
};

// ================================
// TAB 4: TRANSFERS MANAGEMENT
// ================================

const TransfersManagementTab: React.FC<TabProps> = ({ systemStatus, onExecuteAction, isLoading }) => {
    const totalPending = systemStatus.transfers.pending;

    return (
        <div className={styles.tabPanel}>
            <div className={styles.overview}>
                <h3 className={styles.sectionTitle}>Transfer Management</h3>

                <div className={styles.transfersGrid}>
                    <div className={styles.divisionCard}>
                        <h4>All Divisions</h4>
                        <div className={styles.transferStats}>
                            <span className={styles.pending}>Total Pending: {totalPending}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <h3 className={styles.sectionTitle}>Transfer Actions</h3>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.primary}`}
                    onClick={() => onExecuteAction('processPendingTransfers')}
                    disabled={isLoading || totalPending === 0}
                >
                    <Icons.SyncIcon />
                    Process Pending Transfers ({totalPending})
                </button>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => onExecuteAction('validateTransferRules')}
                    disabled={isLoading}
                >
                    <Icons.CheckIcon />
                    Validate Transfer Rules
                </button>
            </div>
        </div>
    );
};

// ================================
// TAB 5: GAMEWEEK PROCESSING
// ================================

const GameweekProcessingTab: React.FC<TabProps> = ({ systemStatus, onExecuteAction, isLoading }) => {
    return (
        <div className={styles.tabPanel}>
            <div className={styles.overview}>
                <h3 className={styles.sectionTitle}>Gameweek Processing</h3>

                <div className={styles.gameweekStatus}>
                    <div className={styles.statusCard}>
                        <h4>Current Status</h4>
                        <div className={styles.gameweekInfo}>
                            <p>Current Gameweek: {systemStatus.currentGameweek}</p>
                            <p>Is Up to date: {systemStatus.gameweekProcessing.isUpToDate}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <h3 className={styles.sectionTitle}>Gameweek Actions</h3>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.primary}`}
                    onClick={() => onExecuteAction('processGameweek', { gameweek: systemStatus.currentGameweek })}
                    disabled={isLoading}
                >
                    <Icons.SyncIcon />
                    Process Current Gameweek
                </button>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => onExecuteAction('calculateGameweekPoints')}
                    disabled={isLoading}
                >
                    <Icons.ChartIcon />
                    Calculate Gameweek Points
                </button>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => onExecuteAction('updateLeagueStandings')}
                    disabled={isLoading}
                >
                    <Icons.TrendingUpIcon />
                    Update League Standings
                </button>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => onExecuteAction('finalizeGameweek')}
                    disabled={isLoading}
                >
                    <Icons.CheckIcon />
                    Finalize Gameweek
                </button>
            </div>
        </div>
    );
};

// ================================
// TAB 6: CACHE & DEBUG
// ================================

const CacheDebugTab: React.FC<TabProps> = ({ systemStatus, onExecuteAction, isLoading }) => {
    const [selectedCacheKey, setSelectedCacheKey] = useState('');

    // Common cache keys for quick selection
    const commonCacheKeys = [
        'fpl:players',
        'fpl:teams',
        'fpl:events',
        'sheets:divisions',
        'sheets:managers',
        'admin:context',
        'firebase:cache-status',
    ];

    return (
        <div className={styles.tabPanel}>
            <div className={styles.overview}>
                <h3 className={styles.sectionTitle}>Cache Management & Debug</h3>

                <div className={styles.debugInfo}>
                    <div className={styles.statusCard}>
                        <h4>Cache System</h4>
                        <div className={styles.debugDetails}>
                            <p>System: DataCacheService</p>
                            <p>Independent TTLs: ✅ Enabled</p>
                            <p>Promise Deduplication: ✅ Active</p>
                        </div>
                    </div>

                    <div className={styles.statusCard}>
                        <h4>Cache Statistics</h4>
                        <div className={styles.debugDetails}>
                            <p>Hit Rate: Available via /api/cache</p>
                            <p>Cache Size: Monitored</p>
                            <p>TTL Management: Per-endpoint</p>
                            <p>Invalidation: Action-based</p>
                        </div>
                    </div>
                </div>

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
            </div>

            <div className={styles.actions}>
                <h3 className={styles.sectionTitle}>Cache Actions</h3>

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

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={() => onExecuteAction('runDiagnosticTests')}
                    disabled={isLoading}
                >
                    <Icons.CheckIcon />
                    Run System Diagnostics
                </button>

                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.warning}`}
                    onClick={() => {
                        if (
                            confirm(
                                'Are you sure you want to force rebuild everything? This will clear all caches and reload all data.',
                            )
                        ) {
                            onExecuteAction('forceRebuildEverything');
                        }
                    }}
                    disabled={isLoading}
                >
                    <Icons.RefreshIcon />
                    Force Rebuild Everything
                </button>
            </div>
        </div>
    );
};
