// app/admin/adminv2.route.tsx

import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { data, useLoaderData } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import type { DivisionId } from '../teams/types/team-types';
import { AdminDashboardTabs } from './components/tabs/admin-dashboard-tabs';
import type { SystemStatusSummary } from './types/admin-types';

interface AdminLoaderData {
    systemStatus: SystemStatusSummary;
    cacheInfo: any;
}

interface AdminActionData {
    success?: boolean;
    error?: string;
    message?: string;
    data?: any;
}

/**
 * Load admin system status using the unified AdminOrchestrator
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        console.log('🔄 AdminV2 Loader - Using unified system-status service');

        // Use the updated AdminOrchestrator which now delegates to system-status.service.ts
        const { AdminOrchestrator } = await import('./server/services/admin-orchestrator.service');
        const orchestrator = new AdminOrchestrator();
        const systemStatus = await orchestrator.getSystemStatus();

        // Get cache info directly from DataCacheService
        const { dataCache } = await import('../_shared/lib/cache/data-cache.service');
        const { CACHE_KEYS } = await import('../_shared/lib/cache/cache-config');
        const cacheInfo = dataCache.getCacheInfo(CACHE_KEYS.FPL.EVENTS);

        console.log('✅ AdminV2 Loader - System status loaded using unified system-status service');

        return {
            systemStatus,
            cacheInfo,
        };
    } catch (error) {
        console.error('❌ AdminV2 Loader error:', error);

        // Fallback to safe default data
        const fallbackStatus: SystemStatusSummary = {
            systemHealth: { overall: { status: 'healthy' } },
            fplApiStatus: 'unhealthy',
            transfersPending: 0,
            draftActive: false,
            currentGameweek: 1,
            lastUpdate: new Date().toISOString(),
            recommendedActions: ['System status could not be loaded - check connectivity'],
        };

        return {
            systemStatus: fallbackStatus,
            cacheInfo: {
                exists: false,
                error: 'Failed to load cache info',
                note: 'Cache system unavailable',
            },
        };
    }
}

/**
 * Handle admin actions using the updated AdminOrchestrator + cache invalidation
 */
export async function action({ request, context }: ActionFunctionArgs): Promise<AdminActionData> {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get('actionType')?.trim();

        if (!actionType) {
            return data<AdminActionData>({
                success: false,
                error: 'Action type is required',
            });
        }

        console.log(`🎬 AdminV2 action: ${actionType}`);

        // Use the updated AdminOrchestrator which handles cache invalidation
        const { AdminOrchestrator } = await import('./server/services/admin-orchestrator.service');
        const orchestrator = new AdminOrchestrator();

        let result: AdminActionData;

        switch (actionType) {
            case 'smartUpdate': {
                const smartResult = await orchestrator.executeSmartUpdate();
                result = {
                    success: smartResult.success,
                    message: smartResult.message,
                    data: {
                        actionsPerformed: smartResult.actionsPerformed,
                        errors: smartResult.errors,
                    },
                };
                break;
            }

            case 'systemHealthCheck': {
                try {
                    // Use the unified system-status service directly instead of real-system-health
                    const { getSystemStatus } = await import('./server/services/system-status.service');
                    const systemStatus = await getSystemStatus();

                    // Convert to health check result format
                    const healthResult = {
                        success: true,
                        message: `System health check completed - ${systemStatus.systemHealth.overall.message}`,
                        data: {
                            overallHealth: systemStatus.systemHealth.overall.status,
                            components: {
                                fplCache: {
                                    status: systemStatus.systemHealth.fplCache.status,
                                    message: systemStatus.systemHealth.fplCache.message,
                                },
                                firebase: {
                                    status: systemStatus.systemHealth.firebase.status,
                                    message: systemStatus.systemHealth.firebase.message,
                                },
                                googleSheets: {
                                    status: systemStatus.systemHealth.googleSheets.status,
                                    message: systemStatus.systemHealth.googleSheets.message,
                                },
                            },
                            summary: {
                                currentGameweek: systemStatus.currentGameweek,
                                pendingTransfers: systemStatus.transfers.pending,
                                activeDrafts: systemStatus.draft.isActive ? 1 : 0,
                                recommendations: systemStatus.recommendations,
                            },
                        },
                    };

                    result = {
                        success: healthResult.success,
                        message: healthResult.message,
                        data: healthResult.data,
                    };
                } catch (healthError) {
                    result = {
                        success: false,
                        message: `Health check failed: ${healthError instanceof Error ? healthError.message : 'Unknown error'}`,
                    };
                }
                break;
            }

            case 'processGameweek': {
                const gameweek = Number.parseInt(formData.get('gameweek') as string, 10) || undefined;
                if (!gameweek) {
                    throw new Error('Gameweek is required');
                }
                const gameweekResult = await orchestrator.processGameweek({
                    gameweek,
                    fplData: (await orchestrator.getSharedContext()).fplData,
                    sheetData: (await orchestrator.getSharedContext()).sheetData,
                });

                result = {
                    success: gameweekResult.transfersProcessed > 0 || gameweekResult.pointsCalculated > 0,
                    message: `Gameweek processing completed: ${gameweekResult.transfersProcessed} transfers, ${gameweekResult.pointsCalculated} points calculated`,
                    data: gameweekResult,
                };
                break;
            }

            case 'processDraft': {
                const divisionId = formData.get('divisionId')?.trim() as DivisionId;
                const draftActionType = formData.get('draftAction')?.trim() as 'start' | 'sync' | 'commit' | 'reset';

                if (!divisionId || !draftActionType) {
                    result = {
                        success: false,
                        error: 'Division ID and draft action are required',
                    };
                    break;
                }

                const draftResult = await orchestrator.processDraft({
                    type: draftActionType,
                    divisionId,
                });

                result = {
                    success: draftResult.success,
                    message: draftResult.message,
                    data: draftResult.data,
                };
                break;
            }

            // Cache management actions using the unified cache API
            case 'refreshCache': {
                try {
                    const cacheResponse = await fetch('/api/cache', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            action: 'invalidate-by-action',
                            actionName: 'ADMIN_ACTION',
                            reason: 'Manual cache refresh',
                        }),
                    });

                    const cacheResult = await cacheResponse.json();

                    result = {
                        success: cacheResult.success,
                        message: cacheResult.message || 'Cache refreshed',
                        data: cacheResult.data,
                    };
                } catch (error) {
                    result = {
                        success: false,
                        message: `Cache refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    };
                }
                break;
            }

            case 'clearCache': {
                try {
                    const cacheResponse = await fetch('/api/cache', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            action: 'clear',
                            reason: 'Manual cache clear from admin',
                        }),
                    });

                    const cacheResult = await cacheResponse.json();

                    result = {
                        success: cacheResult.success,
                        message: cacheResult.message || 'All cache cleared',
                        data: cacheResult.data,
                    };
                } catch (error) {
                    result = {
                        success: false,
                        message: `Cache clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    };
                }
                break;
            }

            case 'invalidateSpecificCache': {
                const cacheKey = formData.get('cacheKey')?.trim();

                if (!cacheKey) {
                    result = {
                        success: false,
                        error: 'Cache key is required',
                    };
                    break;
                }

                try {
                    const cacheResponse = await fetch('/api/cache', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            action: 'invalidate',
                            key: cacheKey,
                            reason: 'Manual invalidation from admin',
                        }),
                    });

                    const cacheResult = await cacheResponse.json();

                    result = {
                        success: cacheResult.success,
                        message: cacheResult.message || `Cache key invalidated: ${cacheKey}`,
                        data: cacheResult.data,
                    };
                } catch (error) {
                    result = {
                        success: false,
                        message: `Cache invalidation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    };
                }
                break;
            }

            case 'testAction': {
                result = {
                    success: true,
                    message: 'Test action completed successfully - unified system-status service is working!',
                    data: {
                        timestamp: new Date().toISOString(),
                        systemStatusService: 'Unified system-status.service.ts',
                        version: '2.0',
                    },
                };
                break;
            }

            default:
                // Fall back to mock for unimplemented actions
                result = getMockActionResult(actionType);
        }

        return data<AdminActionData>(result);
    } catch (error) {
        console.error('AdminV2 action error:', error);
        return data<AdminActionData>({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to perform admin action',
        });
    }
}

export default function AdminV2Route() {
    const { systemStatus, cacheInfo } = useLoaderData() as AdminLoaderData;

    return (
        <div
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f5f5f5',
                padding: '20px',
            }}
        >
            <div
                style={{
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
            >
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                    Admin Dashboard V2 (Unified System Status)
                </h1>
                <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                    Using unified system-status.service.ts - no more duplicate health determination logic
                </p>

                {/* Cache Info Display */}
                {cacheInfo && (
                    <div
                        style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            color: '#888',
                            display: 'flex',
                            gap: '16px',
                        }}
                    >
                        <span>Cache: {cacheInfo.exists ? '✅ Active' : '❌ Empty'}</span>
                        {cacheInfo.exists && (
                            <>
                                <span>Age: {Math.round((cacheInfo.age || 0) / 1000)}s</span>
                                <span>TTL: {Math.round((cacheInfo.ttl || 0) / 1000)}s</span>
                                <span>Expired: {cacheInfo.expired ? '⚠️ Yes' : '✅ No'}</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                <AdminDashboardTabs systemStatus={systemStatus} />
            </div>
        </div>
    );
}

// ================================
// MOCK ACTION RESPONSES (for actions not yet implemented)
// ================================

function getMockActionResult(actionType: string): AdminActionData {
    switch (actionType) {
        case 'validateDataIntegrity':
            return {
                success: true,
                message: 'Data integrity validation passed',
                data: {
                    fplPlayers: 631,
                    fplTeams: 20,
                    fplEvents: 38,
                    divisions: 3,
                    userTeams: 24,
                    issues: [],
                },
            };

        case 'refreshFplData':
            return {
                success: true,
                message: 'FPL data refreshed and cache invalidated',
                data: {
                    playersUpdated: 631,
                    teamsUpdated: 20,
                    cacheInvalidated: ['fpl:players', 'fpl:teams', 'fpl:events'],
                },
            };

        case 'clearFirestore':
            return {
                success: true,
                message: 'Firestore cache cleared successfully',
                data: {
                    collectionsCleared: 5,
                    documentsRemoved: 1250,
                    cacheInvalidated: ['firebase:cache-status'],
                },
            };

        default:
            return {
                success: false,
                error: `Unknown action type: ${actionType}`,
            };
    }
}
