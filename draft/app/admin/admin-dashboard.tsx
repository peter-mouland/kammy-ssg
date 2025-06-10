import React, { useState } from 'react';
import {
    useFetcher,
    useLoaderData,
    useActionData,
} from 'react-router';
import * as Icons from './components/admin-icons'
import { ActionCard } from './components/action-card'
import { NavButton } from './components/nav-button'
import { StatusCard } from './components/status-card'
import { DraftCard } from './components/draft-card'
import { SystemHealthBadge } from './components/system-health-badge'
import { CacheStatusDisplay } from './components/cache-status-display'
import { GameweekPointsStatus } from './components/gameweek-points-status'
import { GameweekPointsButton } from './components/gameweek-points-button'
import styles from './admin-dashboard.module.css';

export const AdminDashboard = () => {
    const { divisions, draftOrders, userTeamsByDivision, draftState } = useLoaderData();
    const actionData = useActionData();
    const [activeSection, setActiveSection] = useState('overview');
    const [expandedSections, setExpandedSections] = useState(new Set(['cache-management']));

    const toggleSection = (section) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    return (
        <div className={styles.adminContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerInner}>
                        <div>
                            <h1 className={styles.headerTitle}>Admin Dashboard</h1>
                            <p className={styles.headerSubtitle}>Manage your fantasy football draft system</p>
                        </div>
                        <div className={styles.headerActions}>
                            <SystemHealthBadge />
                            <button className={styles.refreshButton}>
                                <Icons.RefreshIcon />
                                Refresh All
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.layout}>
                    {/* Sidebar Navigation */}
                    <div className={styles.sidebar}>
                        <nav className={styles.nav}>
                            <NavButton
                                active={activeSection === 'overview'}
                                onClick={() => setActiveSection('overview')}
                                icon={<Icons.BarChartIcon />}
                                label="Overview"
                            />
                            <NavButton
                                active={activeSection === 'draft'}
                                onClick={() => setActiveSection('draft')}
                                icon={<Icons.UsersIcon />}
                                label="Draft Management"
                            />
                            <NavButton
                                active={activeSection === 'data'}
                                onClick={() => setActiveSection('data')}
                                icon={<Icons.DatabaseIcon />}
                                label="Data Management"
                            />
                            <NavButton
                                active={activeSection === 'points'}
                                onClick={() => setActiveSection('points')}
                                icon={<Icons.ChartIcon />}
                                label="Points & Scoring"
                            />
                            <NavButton
                                active={activeSection === 'settings'}
                                onClick={() => setActiveSection('settings')}
                                icon={<Icons.SettingsIcon />}
                                label="Settings"
                            />
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className={styles.content}>
                        {activeSection === 'overview' && <OverviewSection />}
                        {activeSection === 'draft' && (
                            <DraftSection
                                divisions={divisions}
                                draftOrders={draftOrders}
                                userTeamsByDivision={userTeamsByDivision}
                                draftState={draftState}
                                actionData={actionData}
                            />
                        )}
                        {activeSection === 'data' && (
                            <DataManagementSection
                                expandedSections={expandedSections}
                                toggleSection={toggleSection}
                            />
                        )}
                        {activeSection === 'points' && <PointsScoringSection />}
                        {activeSection === 'settings' && <SettingsSection />}
                    </div>
                </div>
            </div>
        </div>
    );
};


// Overview Section
const OverviewSection = () => {
    const fetcher = useFetcher();
    const [cacheData, setCacheData] = useState(null);

    React.useEffect(() => {
        fetcher.submit({ actionType: 'getCacheStatus' }, { method: 'post' });
    }, []);

    React.useEffect(() => {
        if (fetcher.data?.success && fetcher.data?.data) {
            setCacheData(fetcher.data.data);
        }
    }, [fetcher.data]);

    return (
        <div>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Icons.BarChartIcon />
                        System Overview
                    </h2>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.statusGrid}>
                        <StatusCard
                            value={cacheData?.counts?.teams || '...'}
                            label="Teams"
                            percentage="100%"
                            status="healthy"
                        />
                        <StatusCard
                            value={cacheData?.counts?.elementSummaries || '...'}
                            label="Player Stats"
                            percentage={cacheData ? `${Math.round((cacheData.counts.elementSummaries / cacheData.counts.elements) * 100)}%` : '...'}
                            status={cacheData?.missing?.elementSummaries ? "warning" : "healthy"}
                        />
                        <StatusCard
                            value={cacheData?.counts?.events || '...'}
                            label="Events"
                            percentage="100%"
                            status="healthy"
                        />
                        <StatusCard
                            value={cacheData?.hasEnhancedData ? "✓" : "..."}
                            label="Draft Data"
                            percentage={cacheData?.hasEnhancedData ? "Ready" : "Pending"}
                            status={cacheData?.hasEnhancedData ? "healthy" : "warning"}
                        />
                    </div>
                </div>
            </div>

            <QuickActionsSection cacheData={cacheData} />
        </div>
    );
};

// Quick Actions Section
const QuickActionsSection = ({ cacheData }) => {
    const fetcher = useFetcher();

    const executeAction = (actionType) => {
        fetcher.submit({ actionType }, { method: 'post' });
    };

    const getRecommendedAction = () => {
        if (!cacheData) return null;
        if (cacheData.missing?.elements || cacheData.missing?.teams) return 'populateBootstrapData';
        if (cacheData.missing?.elementSummaries) return 'populateElementSummaries';
        if (cacheData.missing?.draftData) return 'generateEnhancedDataFast';
        return 'generateGameWeekPoints';
    };

    const recommendedAction = getRecommendedAction();

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
            </div>
            <div className={styles.sectionContent}>
                <div className={styles.actionGrid}>
                    <ActionCard
                        title="1. Populate Bootstrap Data"
                        description="Fetch FPL teams, events, and basic player data"
                        icon={<Icons.DatabaseIcon />}
                        buttonText="Populate Bootstrap"
                        actionType="populateBootstrapData"
                        onExecute={executeAction}
                        fetcher={fetcher}
                        recommended={recommendedAction === 'populateBootstrapData'}
                    />
                    <ActionCard
                        title="2. Populate Weekly Stats"
                        description="Fetch statistics for all players + weeks"
                        icon={<Icons.ChartIcon />}
                        buttonText="Populate Stats"
                        actionType="populateElementSummaries"
                        onExecute={executeAction}
                        fetcher={fetcher}
                        recommended={recommendedAction === 'populateElementSummaries'}
                    />
                    <ActionCard
                        title="3. Generate Draft Data"
                        description="Add draft calculations and enhanced data"
                        icon={<Icons.TargetIcon />}
                        buttonText="Generate Draft Data"
                        actionType="generateEnhancedDataFast"
                        onExecute={executeAction}
                        fetcher={fetcher}
                        recommended={recommendedAction === 'generateEnhancedDataFast'}
                    />
                    <ActionCard
                        title="4. Update Gameweek Points"
                        description="Smart update - only generates changed gameweeks"
                        icon={<Icons.TrendingUpIcon />}
                        buttonText="Update Points"
                        actionType="generateGameWeekPoints"
                        onExecute={executeAction}
                        fetcher={fetcher}
                        recommended={recommendedAction === 'generateGameWeekPoints'}
                    />
                </div>
            </div>
        </div>
    );
};

// Divisions Section - Using your existing DraftCard logic
const DraftSection = ({ divisions, draftOrders, userTeamsByDivision, draftState, actionData }) => (
    <div>
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
                    <div style={{ marginTop: '1rem' }}>
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
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                    <Icons.SyncIcon />
                    Firebase + GSheets Sync
                </h2>
                <p className={styles.actionDescription}>If the GSheet was manually changed (e.g. a drafted player remove), we will need to sync</p>
            </div>
            <div className={styles.sectionContent}>
                <div className={styles.warningMessage}>
                    💡 <strong>Tip:</strong> Use this after manually editing picks in sheets or if Firebase shows wrong turn/state.
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <FirebaseSyncSection />
                </div>
            </div>
        </div>
    </div>
);

// Data Management Section
const DataManagementSection = ({ expandedSections, toggleSection }) => {
    const fetcher = useFetcher();

    const executeAction = (actionType, variant) => {
        const payload = { actionType };
        if (variant) payload.variant = variant;
        fetcher.submit(payload, { method: 'post' });
    };

    return (
        <div>
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
                <div className={`${styles.collapsibleContent} ${expandedSections.has('cache-management') ? styles.expanded : ''}`}>
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

// Firebase Sync Component
const FirebaseSyncSection = () => {
    const { draftState } = useLoaderData();
    const fetcher = useFetcher();

    const handleSync = () => {
        if (!draftState?.currentDivisionId) return;

        fetcher.submit(
            {
                actionType: 'syncDraft',
                divisionId: draftState.currentDivisionId
            },
            { method: 'post' }
        );
    };

    const isLoading = fetcher.state === 'submitting';
    const hasSuccess = fetcher.data?.success;
    const hasError = fetcher.data?.error;

    return (
        <div>
            <button
                onClick={handleSync}
                disabled={!draftState?.currentDivisionId || !draftState?.isActive || isLoading}
                className={`${styles.actionButton} ${styles.primary}`}
                style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
                {isLoading ? (
                    <>
                        <span className={styles.spinner}></span>
                        Syncing...
                    </>
                ) : hasSuccess ? (
                    <>
                        <Icons.CheckIcon />
                        Synced!
                    </>
                ) : hasError ? (
                    <>
                        <Icons.AlertIcon />
                        Failed
                    </>
                ) : (
                    <>
                        <Icons.SyncIcon />
                        Sync Draft
                    </>
                )}
            </button>

            {!draftState?.isActive && (
                <div className={styles.warningMessage} style={{ marginTop: '1rem' }}>
                    ⚠️ No active draft to sync. Start a draft first.
                </div>
            )}

            {hasSuccess && fetcher.data?.message && (
                <div className={styles.successMessage}>
                    {fetcher.data.message}
                </div>
            )}

            {hasError && (
                <div className={styles.errorMessage}>
                    {fetcher.data.error}
                </div>
            )}
        </div>
    );
};

// Points & Scoring Section
const PointsScoringSection = () => {
    const fetcher = useFetcher();

    const executeAction = (actionType) => {
        fetcher.submit({ actionType }, { method: 'post' });
    };

    return (
        <div>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Icons.ChartIcon />
                        Gameweek Points Management
                    </h2>
                </div>
                <div className={styles.sectionContent}>
                    <GameweekPointsStatus />

                    <div className={styles.actionGrid} style={{ marginTop: '1.5rem' }}>
                        <ActionCard
                            title="Smart Points Update"
                            description="Automatically detects and updates only changed gameweeks"
                            icon={<Icons.TrendingUpIcon />}
                            buttonText="Update Points"
                            actionType="generateGameWeekPoints"
                            onExecute={executeAction}
                            fetcher={fetcher}
                            recommended={true}
                        />
                        <ActionCard
                            title="Force Regenerate All"
                            description="Regenerate all points from scratch (slower)"
                            icon={<Icons.RefreshIcon />}
                            buttonText="Force Regenerate"
                            actionType="forceRegenerateAllPoints"
                            onExecute={executeAction}
                            fetcher={fetcher}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <Icons.TargetIcon />
                        Gameweek Game Points 👉 GSheets
                    </h2>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.warningMessage}>
                        💡 <strong>Gameweek Game Points:</strong> Generates a sheet with one column per gameweek game,
                        showing points for each player's performance in each specific game that gameweek.
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <GameweekPointsButton />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Settings Section
const SettingsSection = () => (
    <div className={styles.section}>
        <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
                <Icons.SettingsIcon />
                System Settings
            </h2>
        </div>
        <div className={styles.sectionContent}>
            <p style={{ color: '#718096' }}>Settings panel coming soon...</p>
        </div>
    </div>
);

export default AdminDashboard;
