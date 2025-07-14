/* Location: app/admin/admin.route.tsx */

import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    useLoaderData,
} from 'react-router';
import { getInvalidationKeys } from '../_shared/lib/cache/cache-config';
import { dataCache } from '../_shared/lib/cache/data-cache.service';
import { requestFormData } from '../_shared/lib/form-data';
import { fplApiCache } from '../_shared/lib/fpl/api-cache';
import type { FplTeam } from '../_shared/lib/fpl/fpl-types';
import type { DraftAction } from '../draft/types/draft-types';
import type { DivisionId } from '../teams/types/team-types';
import type { TransferAdminOverviewData } from '../transfers/types/transfer-rule-types';
import { AdminLayout } from './admin.layout';
import type { AdminDataContext } from './types/admin-orchestrator-types';
import type { SystemStatusSummary } from './types/admin-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'Admin Dashboard - Fantasy Football' },
        { name: 'description', content: 'Admin dashboard for managing fantasy football draft, transfers, and scoring' },
    ];
};

interface AdminLoaderData {
    systemStatus: SystemStatusSummary;
    sharedContext: AdminDataContext;
    transfersData: Record<string, TransferAdminOverviewData> | null;
    teamsByCode: Record<number, FplTeam> | null;
    cacheStats: any | null;
    loadedAt: string;
}

interface AdminActionData {
    success?: boolean;
    error?: string;
    message?: string;
    data?: any;
}

/**
 * Shared loader for all admin routes - loads system status and shared context once
 */
export async function loader({ request }: LoaderFunctionArgs): Promise<AdminLoaderData> {
    console.log('🔄 Loading admin dashboard data...');

    const url = new URL(request.url);
    const { AdminOrchestrator } = await import('./server/services/admin-orchestrator.service');
    const orchestrator = new AdminOrchestrator();
    const teamsByCode = await fplApiCache.getTeamsByCode();

    const [systemStatus, sharedContext] = await Promise.all([
        orchestrator.getSystemStatus(),
        orchestrator.getSharedContext(),
    ]);

    // Load transfer-specific data if we're on a transfer route or need comprehensive data
    let transfersData: Record<string, TransferAdminOverviewData> | null = null;

    const isTransferRoute = url.pathname.includes('/admin/transfers') || url.pathname === '/admin';
    const isCacheRoute = url.pathname.includes('/admin/settings') || url.pathname === '/admin';

    if (isTransferRoute) {
        console.log('🔄 Loading transfer admin data...');
        const { getTransfersAdminData } = await import('./server/transfers-admin.server');
        const divisions = sharedContext.sheetData.divisions;
        const selectedGameweekId =
            Number.parseInt(url.searchParams.get('gameweek') || '', 10) || systemStatus.currentGameweek.fplEvent.id;
        const gameweek = sharedContext.fplData.events.find((gw) => gw.fplEvent.id === selectedGameweekId);

        transfersData = await getTransfersAdminData(divisions, gameweek);
    }

    return {
        systemStatus,
        sharedContext,
        transfersData,
        teamsByCode,
        loadedAt: new Date().toISOString(),
    };
}

/**
 * Unified action handler for all admin operations using the orchestrator
 */
export async function action({ request, context }: ActionFunctionArgs): Promise<AdminActionData> {
    const formData = await requestFormData({ request, context });
    const actionType = formData.get('actionType')?.trim();
    const divisionId = formData.get('divisionId')?.trim() as DivisionId;
    const draftActionType = formData.get('draftAction')?.trim() as DraftAction;
    const gameweekActionType = formData.get('gameweekAction')?.trim();
    const gameweek = Number.parseInt(formData.get('gameweek') as string, 10) || undefined;
    if (!actionType) {
        return data<AdminActionData>({
            success: false,
            error: 'Action type is required',
        });
    }

    const { AdminOrchestrator } = await import('./server/services/admin-orchestrator.service');
    const orchestrator = new AdminOrchestrator();

    let result: AdminActionData;

    try {
        switch (actionType) {
            case 'populateBootstrapData': {
                const result = await orchestrator.preloadCommonData();
                return result;
            }

            case 'systemHealthCheck': {
                const systemStatus = await orchestrator.getSystemStatus();
                result = {
                    success: true,
                    message: `System health check completed - ${systemStatus.systemHealth.overall.message}`,
                    data: systemStatus,
                };
                break;
            }

            case 'processGameweek': {
                dataCache.clear();
                result = await orchestrator.processGameweek({ type: gameweekActionType, gameweek });
                break;
            }

            case 'processDraft': {
                if (!divisionId || !draftActionType) {
                    result = {
                        success: false,
                        error: 'Division ID and draft action are required',
                    };
                    break;
                }

                result = await orchestrator.processDraft({ type: draftActionType, divisionId });
                break;
            }

            // Cache management actions using the unified cache API
            case 'resetDatabase': {
                await orchestrator.clearAllData();
                break;
            }
            case 'refreshSheetsData': {
                const deletedCount = dataCache.invalidateMultiple(getInvalidationKeys('SHEETS_CLEAR', divisionId));
                result = {
                    success: true,
                    data: { deletedCount },
                };
                break;
            }
            case 'refreshFplData': {
                const deletedCount = dataCache.invalidateMultiple(getInvalidationKeys('FPL_DATA_UPDATED'));
                result = {
                    success: true,
                    data: { deletedCount },
                };
                break;
            }
            case 'invalidateAllCaches': {
                result = dataCache.clear();
                break;
            }
            case 'refreshTransfers': {
                const deletedCount = dataCache.invalidateMultiple(getInvalidationKeys('TRANSFERS_UPDATED', divisionId));
                result = {
                    success: true,
                    data: { deletedCount },
                };
                break;
            }

            default: {
                result = {
                    success: false,
                    error: `Unknown action type: ${actionType}`,
                };
                break;
            }
        }

        return data<AdminActionData>(result);
    } catch (error) {
        console.error(`❌ Admin action ${actionType} failed:`, error);

        return data<AdminActionData>({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
    }
}

export default function AdminRoute() {
    const context = useLoaderData<AdminLoaderData>();

    return (
        <AdminLayout>
            <Outlet context={context} />
        </AdminLayout>
    );
}
