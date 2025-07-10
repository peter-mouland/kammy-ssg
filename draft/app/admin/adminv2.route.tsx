// app/admin/adminv2.route.tsx

import type { ActionFunctionArgs } from 'react-router';
import { data } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import type { DraftAction } from '../draft/types/draft-types';
import type { DivisionId } from '../teams/types/team-types';

interface AdminActionData {
    success?: boolean;
    error?: string;
    message?: string;
    data?: any;
}

/**
 * Handle admin actions using the updated AdminOrchestrator + cache invalidation
 */
export async function action({ request, context }: ActionFunctionArgs): Promise<AdminActionData> {
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
            const { getSystemStatus } = await import('./server/services/system-status.service');
            const systemStatus = await getSystemStatus();

            result = {
                success: true,
                message: `System health check completed - ${systemStatus.systemHealth.overall.message}`,
                data: systemStatus,
            };
            break;
        }

        case 'processGameweek': {
            const sharedContext = await orchestrator.getSharedContext();
            const gameweek = Number.parseInt(formData.get('gameweek') as string, 10) || undefined;
            if (!gameweek) {
                throw new Error('Gameweek is required');
            }
            const gameweekResult = await orchestrator.processGameweek({
                gameweek,
                fplData: sharedContext.fplData,
                sheetData: sharedContext.sheetData,
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
            const draftActionType = formData.get('draftAction')?.trim() as DraftAction;

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
    }

    return data<AdminActionData>(result);
}
