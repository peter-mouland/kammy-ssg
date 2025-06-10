import React, { useState } from 'react';
import {
    useFetcher,
    useLoaderData,
    useActionData,
} from 'react-router';
import * as Icons from './components/admin-icons'
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
            case 'healthy': return <Icons.CheckIcon />;
            case 'warning': return <Icons.AlertIcon />;
            case 'critical': return <Icons.AlertIcon />;
            default: return <Icons.ClockIcon />;
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
                    <Icons.RefreshIcon />
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
                        <Icons.CheckIcon />
                        Generated!
                    </>
                ) : error ? (
                    <>
                        <Icons.AlertIcon />
                        Failed
                    </>
                ) : (
                    <>
                        <Icons.TargetIcon />
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
