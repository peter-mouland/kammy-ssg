import { useFetcher } from 'react-router';
import { useState, useEffect } from 'react';
import styles from './cache-status.module.css';

interface CacheStatusProps {
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export function CacheStatus({ autoRefresh = false, refreshInterval = 30000 }: CacheStatusProps) {
    const fetcher = useFetcher();
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const cacheData = fetcher.data?.data;
    const isLoading = fetcher.state === 'submitting';
    const hasError = fetcher.data?.error;

    // Auto-refresh functionality
    useEffect(() => {
        if (autoRefresh && !isLoading) {
            const interval = setInterval(() => {
                refreshStatus();
            }, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval, isLoading]);

    // Load initial status
    useEffect(() => {
        if (!cacheData && !isLoading && !hasError) {
            refreshStatus();
        }
    }, []);

    const refreshStatus = () => {
        fetcher.submit(
            { actionType: 'getCacheStatus' },
            { method: 'post' }
        );
        setLastRefresh(new Date());
    };

    const executeAction = (actionType: string) => {
        fetcher.submit(
            { actionType },
            { method: 'post' }
        );
    };

    const getHealthColor = (health: string) => {
        switch (health) {
            case 'healthy': return styles.healthy;
            case 'warning': return styles.warning;
            case 'critical': return styles.critical;
            default: return styles.unknown;
        }
    };

    return (
        <div className={styles.cacheStatus}>
            <div className={styles.header}>
                <h4 className={styles.title}>Cache Status</h4>
                <button
                    onClick={refreshStatus}
                    disabled={isLoading}
                    className={styles.refreshButton}
                >
                    {isLoading ? '⏳' : '🔄'} Refresh
                </button>
            </div>

            {hasError && (
                <div className={styles.error}>
                    ❌ Error: {fetcher.data.error}
                </div>
            )}

            {cacheData && (
                <>
                    {/* Overall Health */}
                    <div className={`${styles.healthCard} ${getHealthColor(cacheData.health?.overall)}`}>
                        <div className={styles.healthHeader}>
              <span className={styles.healthIcon}>
                {cacheData.health?.overall === 'healthy' ? '✅' :
                    cacheData.health?.overall === 'warning' ? '⚠️' : '❌'}
              </span>
                            <span className={styles.healthText}>
                {cacheData.health?.overall?.toUpperCase() || 'UNKNOWN'}
              </span>
                            <span className={styles.completion}>
                {cacheData.completionPercentage}% Complete
              </span>
                        </div>

                        {cacheData.health?.issues?.length > 0 && (
                            <div className={styles.issues}>
                                <strong>Issues:</strong>
                                <ul>
                                    {cacheData.health.issues.map((issue: string, index: number) => (
                                        <li key={index}>{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Data Counts */}
                    <div className={styles.countsGrid}>
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
                            label="Draft Data"
                            count={cacheData.hasEnhancedData ? cacheData.counts?.elements || 0 : 0}
                            missing={cacheData.missing?.draftData}
                            expected={cacheData.counts?.elements || 600}
                        />
                        <DataCount
                            label="Player Stats"
                            count={cacheData.counts?.elementSummaries || 0}
                            missing={cacheData.missing?.elementSummaries}
                            expected={cacheData.counts?.elements || 600}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actionsGrid}>
                        <ActionButton
                            title="1. Populate All FPL Bootstrap Data"
                            description="Fetch FPL teams, events, and basic player data"
                            icon="📊"
                            actionType="populateBootstrapData"
                            onExecute={executeAction}
                            disabled={isLoading}
                            recommended={cacheData.missing?.elements || cacheData.missing?.teams}
                        />

                        <ActionButton
                            title="2. Populate Weekly Stats"
                            description="Fetch + save statistics for all players + weeks"
                            icon="📈"
                            actionType="populateElementSummaries"
                            onExecute={executeAction}
                            disabled={isLoading || cacheData.missing?.elements}
                            recommended={cacheData.missing?.elementSummaries && !cacheData.missing?.elements}
                        />

                        <ActionButton
                            title="3. Generate All Points + Save Stats"
                            description="Add draft calculations"
                            icon="⚡"
                            actionType="generateEnhancedDataFast"
                            onExecute={executeAction}
                            disabled={isLoading || cacheData.missing?.elements}
                            recommended={cacheData.missing?.draftData && !cacheData.missing?.elements}
                        />
                    </div>

                    {/* Recommendations */}
                    {cacheData.health?.recommendations?.length > 0 && (
                        <div className={styles.recommendations}>
                            <h5>💡 Recommendations:</h5>
                            <ul>
                                {cacheData.health.recommendations.map((rec: string, index: number) => (
                                    <li key={index}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Last Updated */}
                    {lastRefresh && (
                        <div className={styles.lastUpdated}>
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

interface DataCountProps {
    label: string;
    count: number;
    missing: boolean;
    expected: number;
}

function DataCount({ label, count, missing, expected }: DataCountProps) {
    const percentage = expected > 0 ? Math.round((count / expected) * 100) : 0;

    return (
        <div className={`${styles.dataCount} ${missing ? styles.missing : styles.present}`}>
            <div className={styles.countValue}>{count.toLocaleString()}</div>
            <div className={styles.countLabel}>{label}</div>
            {!missing && (
                <div className={styles.countPercentage}>{percentage}%</div>
            )}
        </div>
    );
}

interface ActionButtonProps {
    title: string;
    description: string;
    icon: string;
    actionType: string;
    onExecute: (actionType: string) => void;
    disabled: boolean;
    recommended: boolean;
}

function ActionButton({
                          title,
                          description,
                          icon,
                          actionType,
                          onExecute,
                          disabled,
                          recommended
                      }: ActionButtonProps) {
    return (
        <div className={`${styles.actionButton} ${recommended ? styles.recommended : ''}`}>
            <button
                onClick={() => onExecute(actionType)}
                disabled={disabled}
                className={styles.actionBtn}
            >
                <span className={styles.actionIcon}>{icon}</span>
                <div className={styles.actionContent}>
                    <div className={styles.actionTitle}>{title}</div>
                    <div className={styles.actionDescription}>{description}</div>
                </div>
                {recommended && <span className={styles.recommendedBadge}>Recommended</span>}
            </button>
        </div>
    );
}
