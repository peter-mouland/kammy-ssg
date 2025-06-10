import React, { useState } from 'react';
import {
    useFetcher,
    useLoaderData,
    useActionData,
} from 'react-router';
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
                                <RefreshIcon />
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
                                icon={<BarChartIcon />}
                                label="Overview"
                            />
                            <NavButton
                                active={activeSection === 'draft'}
                                onClick={() => setActiveSection('draft')}
                                icon={<UsersIcon />}
                                label="Draft Management"
                            />
                            <NavButton
                                active={activeSection === 'data'}
                                onClick={() => setActiveSection('data')}
                                icon={<DatabaseIcon />}
                                label="Data Management"
                            />
                            <NavButton
                                active={activeSection === 'points'}
                                onClick={() => setActiveSection('points')}
                                icon={<ChartIcon />}
                                label="Points & Scoring"
                            />
                            <NavButton
                                active={activeSection === 'settings'}
                                onClick={() => setActiveSection('settings')}
                                icon={<SettingsIcon />}
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

// Navigation Button Component
const NavButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`${styles.navButton} ${active ? styles.active : ''}`}
    >
        <span className={styles.navIcon}>{icon}</span>
        {label}
    </button>
);

// System Health Badge Component
const SystemHealthBadge = () => {
    const fetcher = useFetcher();
    const [status, setStatus] = useState('unknown');

    React.useEffect(() => {
        // Auto-load cache status on mount
        if (!fetcher.data && fetcher.state === 'idle') {
            fetcher.submit({ actionType: 'getCacheStatus' }, { method: 'post' });
        }
    }, []);

    React.useEffect(() => {
        if (fetcher.data?.success && fetcher.data?.data?.health) {
            setStatus(fetcher.data.data.health.overall);
        }
    }, [fetcher.data]);

    const getIcon = () => {
        switch (status) {
            case 'healthy': return <CheckIcon />;
            case 'warning': return <AlertIcon />;
            case 'critical': return <AlertIcon />;
            default: return <ClockIcon />;
        }
    };

    return (
        <div className={`${styles.healthBadge} ${styles[status]}`}>
            {getIcon()}
            <span style={{ marginLeft: '0.25rem' }}>
        {status === 'healthy' ? 'System Healthy' :
            status === 'warning' ? 'Minor Issues' :
                status === 'critical' ? 'Critical Issues' : 'Checking...'}
      </span>
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
                        <BarChartIcon />
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

// Status Card Component
const StatusCard = ({ value, label, percentage, status }) => (
    <div className={`${styles.statusCard} ${styles[status]}`}>
        <div className={styles.statusValue}>{value}</div>
        <div className={styles.statusLabel}>{label}</div>
        <div className={styles.statusPercentage}>{percentage}</div>
    </div>
);

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
                        icon={<DatabaseIcon />}
                        buttonText="Populate Bootstrap"
                        actionType="populateBootstrapData"
                        onExecute={executeAction}
                        fetcher={fetcher}
                        recommended={recommendedAction === 'populateBootstrapData'}
                    />
                    <ActionCard
                        title="2. Populate Weekly Stats"
                        description="Fetch statistics for all players + weeks"
                        icon={<ChartIcon />}
                        buttonText="Populate Stats"
                        actionType="populateElementSummaries"
                        onExecute={executeAction}
                        fetcher={fetcher}
                        recommended={recommendedAction === 'populateElementSummaries'}
                    />
                    <ActionCard
                        title="3. Generate Draft Data"
                        description="Add draft calculations and enhanced data"
                        icon={<TargetIcon />}
                        buttonText="Generate Draft Data"
                        actionType="generateEnhancedDataFast"
                        onExecute={executeAction}
                        fetcher={fetcher}
                        recommended={recommendedAction === 'generateEnhancedDataFast'}
                    />
                    <ActionCard
                        title="4. Update Gameweek Points"
                        description="Smart update - only generates changed gameweeks"
                        icon={<TrendingUpIcon />}
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

// Action Card Component
const ActionCard = ({ title, description, icon, buttonText, actionType, onExecute, fetcher, recommended, disabled }) => {
    const isLoading = fetcher.state === 'submitting' && fetcher.formData?.get('actionType') === actionType;
    const hasSuccess = fetcher.data?.success && fetcher.formData?.get('actionType') === actionType;
    const hasError = fetcher.data?.error && fetcher.formData?.get('actionType') === actionType;

    return (
        <div className={`${styles.actionCard} ${recommended ? styles.recommended : ''}`}>
            <div className={styles.actionTitle}>
                {icon}
                {title}
                {recommended && <span style={{ fontSize: '0.75rem', color: '#4299e1' }}>RECOMMENDED</span>}
            </div>
            <div className={styles.actionDescription}>{description}</div>
            <button
                className={`${styles.actionButton} ${recommended ? styles.primary : styles.secondary}`}
                onClick={() => onExecute(actionType)}
                disabled={disabled || isLoading}
            >
                {isLoading ? (
                    <>
                        <span className={styles.spinner}></span>
                        Loading...
                    </>
                ) : hasSuccess ? (
                    '✓ Complete'
                ) : hasError ? (
                    '✗ Failed'
                ) : (
                    buttonText
                )}
            </button>

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

// Divisions Section - Using your existing DraftCard logic
const DraftSection = ({ divisions, draftOrders, userTeamsByDivision, draftState, actionData }) => (
    <div>
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                    <UsersIcon />
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
                    <SyncIcon />
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

// Division Card Component - Matching your existing logic
const DraftCard = ({ division, teams, orders, draftState }) => {
    const fetcher = useFetcher();
    const isLoading = fetcher.state === "submitting";

    const handleAction = (actionType) => {
        fetcher.submit(
            { actionType, divisionId: division.id },
            { method: "post" }
        );
    };

    const isActive = !!(draftState?.isActive && draftState.currentDivisionId === division.id);

    const getDivisionStatus = () => {
        if (teams.length === 0) {
            return { status: "No Teams", color: "#6b7280", disabled: true, variant: 'disabled' };
        }
        if (orders.length === 0) {
            return {
                status: "🎲 Generate Order",
                color: "#f59e0b",
                disabled: false,
                action: "generateOrder",
                variant: 'generate'
            };
        }
        if (isActive) {
            return {
                status: "🛑 Stop Draft",
                color: "#ef4444",
                disabled: false,
                action: "stopDraft",
                variant: 'stop'
            };
        }
        if (draftState?.isActive) {
            return {
                status: "⚪️ Start Draft",
                color: "#6b7280",
                disabled: true,
                action: "startDraft",
                variant: 'disabled'
            };
        }
        return {
            status: "🟢 Start Draft",
            color: "#10b981",
            disabled: false,
            action: "startDraft",
            variant: 'start'
        };
    };

    const divisionStatus = getDivisionStatus();

    return (
        <div className={`${styles.divisionCard} ${isActive ? styles.active : ''}`}>
            <div className={styles.divisionHeader}>
                <div>
                    <h3 className={`${styles.divisionTitle} ${isActive ? styles.active : ''}`}>
                        {isActive && '🟢 '}
                        {division.label}
                    </h3>
                    <div className={styles.divisionStats}>
                        {teams.length} teams {orders.length > 0 ? '' : ' • No order yet'}
                    </div>
                </div>
                <button
                    onClick={() => handleAction(divisionStatus.action)}
                    className={`${styles.draftButton} ${styles[divisionStatus.variant]}`}
                    disabled={divisionStatus.disabled || isLoading}
                >
                    {isLoading ? 'Loading...' : divisionStatus.status}
                </button>
            </div>

            {orders.length > 0 && (
                <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.5rem' }}>
                    Draft order generated • {orders.length} teams
                </div>
            )}
        </div>
    );
};

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
                        <DatabaseIcon />
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
                        <TrashIcon />
                        Manual Cache Clearing
                    </h2>
                    <ChevronIcon expanded={expandedSections.has('cache-management')} />
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
                        <CheckIcon />
                        Synced!
                    </>
                ) : hasError ? (
                    <>
                        <AlertIcon />
                        Failed
                    </>
                ) : (
                    <>
                        <SyncIcon />
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

// Cache Status Display Component
const CacheStatusDisplay = () => {
    const fetcher = useFetcher();
    const [cacheData, setCacheData] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

    const refreshStatus = () => {
        fetcher.submit({ actionType: 'getCacheStatus' }, { method: 'post' });
        setLastRefresh(new Date());
    };

    React.useEffect(() => {
        if (!cacheData) {
            refreshStatus();
        }
    }, []);

    React.useEffect(() => {
        if (fetcher.data?.success && fetcher.data?.data) {
            setCacheData(fetcher.data.data);
        }
    }, [fetcher.data]);

    if (!cacheData) {
        return <div>Loading cache status...</div>;
    }

    const getHealthColor = (health) => {
        switch (health) {
            case 'healthy': return styles.healthy;
            case 'warning': return styles.warning;
            case 'critical': return styles.critical;
            default: return '';
        }
    };

    return (
        <div>
            {/* Overall Health */}
            <div className={`${styles.statusCard} ${getHealthColor(cacheData.health?.overall)} ${styles.healthCard}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>
              {cacheData.health?.overall === 'healthy' ? '✅' :
                  cacheData.health?.overall === 'warning' ? '⚠️' : '❌'}
            </span>
                        <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>
              {cacheData.health?.overall || 'UNKNOWN'}
            </span>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {cacheData.completionPercentage}% Complete
          </span>
                </div>

                {cacheData.health?.issues?.length > 0 && (
                    <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                        <strong>Issues:</strong>
                        <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                            {cacheData.health.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Data Counts */}
            <div className={styles.statusGrid} style={{ marginTop: '1rem' }}>
                <DataCount
                    label="Teams"
                    count={cacheData.counts?.teams || 0}
                    missing={cacheData.missing?.teams}
                    expected={20}
                />
                <DataCount
                    label="Events"
                    count={cacheData.counts?.events || 0}
                    missing={cacheData.missing?.events}
                    expected={38}
                />
                <DataCount
                    label="Players"
                    count={cacheData.counts?.elements || 0}
                    missing={cacheData.missing?.elements}
                    expected={600}
                />
                <DataCount
                    label="Player Stats"
                    count={cacheData.counts?.elementSummaries || 0}
                    missing={cacheData.missing?.elementSummaries}
                    expected={cacheData.counts?.elements || 600}
                />
            </div>

            {/* Recommendations */}
            {cacheData.health?.recommendations?.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0' }}>💡 Recommendations:</h5>
                    <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                        {cacheData.health.recommendations.map((rec, index) => (
                            <li key={index} style={{ fontSize: '0.875rem' }}>{rec}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Last Updated */}
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button onClick={refreshStatus} className={styles.refreshButton}>
                    <RefreshIcon />
                    Refresh Status
                </button>
                {lastRefresh && (
                    <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.5rem' }}>
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    );
};

// Data Count Component
const DataCount = ({ label, count, missing, expected }) => {
    const percentage = expected > 0 ? Math.round((count / expected) * 100) : 0;

    return (
        <div className={`${styles.statusCard} ${missing ? styles.warning : styles.healthy}`}>
            <div className={styles.statusValue}>{count.toLocaleString()}</div>
            <div className={styles.statusLabel}>{label}</div>
            {!missing && (
                <div className={styles.statusPercentage}>{percentage}%</div>
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
                        <ChartIcon />
                        Gameweek Points Management
                    </h2>
                </div>
                <div className={styles.sectionContent}>
                    <GameweekPointsStatus />

                    <div className={styles.actionGrid} style={{ marginTop: '1.5rem' }}>
                        <ActionCard
                            title="Smart Points Update"
                            description="Automatically detects and updates only changed gameweeks"
                            icon={<TrendingUpIcon />}
                            buttonText="Update Points"
                            actionType="generateGameWeekPoints"
                            onExecute={executeAction}
                            fetcher={fetcher}
                            recommended={true}
                        />
                        <ActionCard
                            title="Force Regenerate All"
                            description="Regenerate all points from scratch (slower)"
                            icon={<RefreshIcon />}
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
                        <TargetIcon />
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

// Gameweek Points Status Component
const GameweekPointsStatus = () => {
    const fetcher = useFetcher();
    const [status, setStatus] = useState(null);

    React.useEffect(() => {
        fetcher.submit({ actionType: 'getGameweekPointsStatus' }, { method: 'post' });
    }, []);

    React.useEffect(() => {
        if (fetcher.data?.success && fetcher.data?.data) {
            setStatus(fetcher.data.data);
        }
    }, [fetcher.data]);

    if (!status) return <div>Loading points status...</div>;

    return (
        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🎯 Gameweek Points Status
            </h4>
            <div className={styles.statusGrid}>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>Current Gameweek:</div>
                    <div style={{ fontWeight: 600 }}>{status.currentGameweek}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>Last Generated:</div>
                    <div style={{ fontWeight: 600 }}>
                        GW{status.lastGameweek}
                        {status.lastGenerated && ` (${new Date(status.lastGenerated).toLocaleDateString()})`}
                    </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>Status:</div>
                    <div style={{
                        fontWeight: 600,
                        color: status.needsUpdate ? '#9c4221' : '#22543d'
                    }}>
                        {status.needsUpdate ? '⚠️ Update Needed' : '✅ Up to Date'}
                    </div>
                </div>
            </div>
            {status.needsUpdate && (
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#718096' }}>
                    <strong>Reason:</strong> {status.reason}
                </div>
            )}
        </div>
    );
};

// Round Points Button Component
const GameweekPointsButton = () => {
    const fetcher = useFetcher();

    const handleGenerateGameweekPoints = () => {
        fetcher.submit(
            { actionType: 'generateGameweekPoints' },
            { method: 'post', action: '/scoring/api/gw-points' }
        );
    };

    const isLoading = fetcher.state === 'submitting';
    const isSuccess = fetcher.data?.success;
    const error = fetcher.data?.error;

    return (
        <div>
            <button
                onClick={handleGenerateGameweekPoints}
                disabled={isLoading}
                className={`${styles.actionButton} ${styles.primary}`}
                style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
                {isLoading ? (
                    <>
                        <span className={styles.spinner}></span>
                        Generating...
                    </>
                ) : isSuccess ? (
                    <>
                        <CheckIcon />
                        Generated!
                    </>
                ) : error ? (
                    <>
                        <AlertIcon />
                        Failed
                    </>
                ) : (
                    <>
                        <TargetIcon />
                        Generate Round Points
                    </>
                )}
            </button>

            {isSuccess && fetcher.data?.message && (
                <div className={styles.successMessage}>
                    {fetcher.data.message}
                </div>
            )}

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}
        </div>
    );
};

// Settings Section
const SettingsSection = () => (
    <div className={styles.section}>
        <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
                <SettingsIcon />
                System Settings
            </h2>
        </div>
        <div className={styles.sectionContent}>
            <p style={{ color: '#718096' }}>Settings panel coming soon...</p>
        </div>
    </div>
);

// Icon Components
const RefreshIcon = () => (
    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const BarChartIcon = () => (
    <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const UsersIcon = () => (
    <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
);

const DatabaseIcon = () => (
    <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
);

const ChartIcon = () => (
    <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const SettingsIcon = () => (
    <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const CheckIcon = () => (
    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const AlertIcon = () => (
    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
);

const ClockIcon = () => (
    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TargetIcon = () => (
    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

const TrendingUpIcon = () => (
    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const TrashIcon = () => (
    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const SyncIcon = () => (
    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const ChevronIcon = ({ expanded }) => (
    <svg
        style={{
            width: '1rem',
            height: '1rem',
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
        }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export default AdminDashboard;
