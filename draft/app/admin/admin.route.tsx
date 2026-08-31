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
import type { FplTeam } from '../_shared/lib/fpl/fpl-types';
import { describeGameweekAvailability } from '../_shared/lib/gameweek-availability';
import { describeUnknownDivisions } from '../_shared/lib/league-divisions';
import { friendlyErrorResponse, loaderErrorResponse, toErrorChain } from '../_shared/lib/loader-error';
import type { DivisionId } from '../_shared/types/league-types';
import type { DraftAction } from '../draft';
import type { TransferAdminOverviewData } from '../transfers';
import { AdminLayout } from './admin.layout';
import styles from './admin.route.module.css';
import type { AdminDataContext } from './types/admin-orchestrator-types';
import type { AdminActionData, SystemStatusSummary } from './types/admin-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'Admin Dashboard - Fantasy Football' },
        { name: 'description', content: 'Admin dashboard for managing fantasy football draft, transfers, and scoring' },
    ];
};

interface AdminLoaderData {
    systemStatus: SystemStatusSummary | null;
    sharedContext: AdminDataContext | null;
    transfersData: Record<string, TransferAdminOverviewData> | null;
    teamsByCode: Record<number, FplTeam> | null;
    /** A sentence naming divisions in the sheet this build does not support, or null. */
    unknownDivisions?: string | null;
    cacheStats: any | null;
    loadedAt: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);

    // Static checklist page — skip FPL/Sheets/Firebase bootstrap
    if (url.pathname.includes('/admin/setup-new-season')) {
        console.log('⚡ Lightweight admin load for setup-new-season');
        return {
            systemStatus: null,
            sharedContext: null,
            transfersData: null,
            teamsByCode: null,
            unknownDivisions: null,
            cacheStats: null,
            loadedAt: new Date().toISOString(),
        };
    }

    console.log('🔄 Loading admin dashboard data...');

    // Sheets, FPL and Firestore are all read below and any of them can fail. Unwrapped, that
    // reached the browser as the same opaque "Unexpected Server Error" the populate action
    // used to give -- on the one page whose job is diagnosing exactly those systems.
    try {
        const { fplApiCache } = await import('../_shared/lib/fpl/api-cache');
        const { AdminOrchestrator } = await import('./server/services/admin-orchestrator.service');
        const orchestrator = new AdminOrchestrator();
        const teamsByCode = await fplApiCache.getTeamsByCode();

        const [systemStatus, sharedContext] = await Promise.all([
            orchestrator.getSystemStatus(),
            orchestrator.getSharedContext(),
        ]);

        // Load transfer-specific data only on the transfers admin page (heavy validation)
        let transfersData: Record<string, TransferAdminOverviewData> | null = null;

        const isTransferRoute = url.pathname.includes('/admin/transfers');

        if (isTransferRoute) {
            // Transfer admin reviews the open transfer window (selection GW), not the scoring
            // GW — same question `/transfers` asks. Mid-window those differ; defaulting to
            // scoring left reviewers on the played round with the next GW unreachable.
            const { transfersAdminSelectionGameweek, resolveTransfersAdminSelectedGameweekId } = await import(
                './lib/transfers-gameweek'
            );
            const selectionGameweek = transfersAdminSelectionGameweek(sharedContext.fplData.events);
            const availability = describeGameweekAvailability(sharedContext.fplData.events, selectionGameweek);
            if (!availability.available) {
                throw friendlyErrorResponse(availability.title, availability.detail);
            }

            const { getTransfersAdminData } = await import('./server/transfers-admin.server');
            const divisions = sharedContext.sheetData.divisions;
            const selectedGameweekId =
                resolveTransfersAdminSelectedGameweekId(
                    sharedContext.fplData.events,
                    url.searchParams.get('gameweek'),
                ) ?? availability.gameweek.fplEvent.id;
            const gameweek = sharedContext.fplData.events.find((gw) => gw.fplEvent.id === selectedGameweekId);

            transfersData = await getTransfersAdminData(divisions, gameweek);
        }

        // A division in the sheet that this build does not know about is worth saying out loud
        // rather than silently dropping. It used to announce itself as
        // "Cannot read properties of undefined (reading 'push')".
        const unknownDivisions = describeUnknownDivisions(
            (sharedContext.sheetData.divisions ?? []).map((division: { id?: string }) => division.id),
        );
        if (unknownDivisions) console.warn(`⚠️  ${unknownDivisions}`);

        return {
            systemStatus,
            sharedContext,
            transfersData,
            teamsByCode,
            unknownDivisions,
            cacheStats: null,
            loadedAt: new Date().toISOString(),
        };
    } catch (error) {
        // The friendly "no gameweek" state above is a deliberate result, not a failure.
        if (error instanceof Response) throw error;

        throw loaderErrorResponse('Failed to load the admin dashboard', error);
    }
}

/**
 * Every link in the cause chain, outermost first, as one line.
 *
 * `error.message` alone is what an admin used to get, and for a wrapped failure it is the
 * least useful link in the chain: `SHEET_READ_ERROR` says a read gave up, the 403 three
 * levels beneath it says why. `toErrorChain` unwraps both shapes this codebase throws --
 * real `Error`s via `cause`, and `createAppError()`'s plain objects via `details`.
 */
function describeActionFailure(error: unknown): string {
    const chain = toErrorChain(error);
    if (chain.length === 0) return 'Unknown error occurred';

    return chain.map((link) => (link.code ? `${link.code}: ${link.message}` : link.message)).join(' → ');
}

/**
 * Unified action handler for all admin operations using the orchestrator
 *
 * **Everything is inside the try, including reading the form.** It used to start outside it,
 * and a throw there -- `requestFormData` indexing an undefined load context -- escaped as an
 * unhandled 500. React Router replaces that with a bare "Unexpected Server Error" before it
 * reaches the browser, so the admin saw a blank error page and the cause reached nobody.
 * An admin action should always come back as action data the page can render.
 */
export async function action({ request, context }: ActionFunctionArgs) {
    let actionType: string | undefined;

    try {
        const formData = await requestFormData({ request, context });
        actionType = formData.get('actionType')?.trim();
        const divisionId = formData.get('divisionId')?.trim() as DivisionId;
        const draftActionType = formData.get('draftAction')?.trim() as DraftAction;
        const gameweekActionType = formData.get('gameweekAction')?.trim() || 'all';
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

        switch (actionType) {
            case 'populateBootstrapData': {
                const populated = await orchestrator.preloadCommonData();

                // Counts, not the payload. This used to return `preloadCommonData()`'s whole
                // result -- every element plus every enhanced player, season breakdowns and
                // all -- serialized back to the browser through the fetcher. Nothing rendered
                // it; the section only reads `jobId` and `error`.
                result = {
                    success: populated.success,
                    message:
                        `Bootstrap populated: ${populated.results.bootstrap.teams.length} teams, ` +
                        `${populated.results.bootstrap.events.length} gameweeks, ` +
                        `${populated.results.bootstrap.elements.length} players, ` +
                        `${populated.results.enhanced.length} enhanced`,
                    data: {
                        teams: populated.results.bootstrap.teams.length,
                        events: populated.results.bootstrap.events.length,
                        elements: populated.results.bootstrap.elements.length,
                        enhanced: populated.results.enhanced.length,
                    },
                };
                break;
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
                console.log('🔍 processGameweek action triggered with:', { actionType, gameweekActionType, gameweek });

                dataCache.clear();

                const { generateJobId } = await import('./libs/admin-progress.server');
                const { progressStore } = await import('./libs/progress-store.server');
                const { regeneratePoints } = await import('./libs/background-jobs.server');
                const jobType = gameweekActionType;
                const jobId = generateJobId();

                progressStore.createJob(jobId, jobType);

                // Add a small delay to let the SSE connection establish first
                setTimeout(() => {
                    regeneratePoints(jobId, jobType, orchestrator, gameweek || undefined).catch((error) => {
                        // Log only. Rethrowing from a setTimeout callback reaches no caller --
                        // it becomes an unhandled rejection, which on Node takes the process
                        // down. And `new Error(msg, string)` was wrong regardless: the second
                        // argument is an options object, so that `error.message` was dropped
                        // on the floor. `regeneratePoints` has already recorded the failure on
                        // the job itself, which is what the client polls and the admin sees.
                        console.error(`🚨 Background job ${jobId} failed:`, error);
                    });
                }, 100); // 100ms delay

                result = {
                    success: true,
                    jobId,
                    message: `Started ${jobType} job with progress tracking`,
                };
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
                // One bounded pass. A collection too large to clear inside the function's
                // 60s timeout used to kill the request outright, so the client repeats this
                // until `done` rather than asking for the whole thing at once.
                const pass = await orchestrator.clearAllData();
                const summary = pass.collections.map(({ name, deleted }) => `${name} ${deleted}`).join(', ');

                result = {
                    success: true,
                    message: pass.done
                        ? `Database reset completed — ${pass.deleted} documents deleted${summary ? ` (${summary})` : ''}`
                        : `Deleted ${pass.deleted} documents${summary ? ` (${summary})` : ''} — more remain, continuing…`,
                    data: pass,
                };
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
            case 'approveTransfer': {
                const transferId = formData.get('transferId')?.trim();
                if (!transferId || !divisionId) {
                    return data<AdminActionData>({
                        success: false,
                        error: 'Transfer ID and division ID are required for approval',
                    });
                }

                const { handleTransferAction } = await import('./server/transfers-admin.server');
                result = await handleTransferAction('approveTransfer', {
                    divisionId,
                    transferId,
                    recommendation: 'APPROVE',
                });
                break;
            }

            case 'rejectTransfer': {
                const transferId = formData.get('transferId')?.trim();
                if (!transferId || !divisionId) {
                    return data<AdminActionData>({
                        success: false,
                        error: 'Transfer ID and division ID are required for rejection',
                    });
                }

                const { handleTransferAction } = await import('./server/transfers-admin.server');
                result = await handleTransferAction('rejectTransfer', {
                    divisionId,
                    transferId,
                    recommendation: 'REJECT',
                });
                break;
            }

            case 'refreshTransfers': {
                if (!divisionId) {
                    return data<AdminActionData>({
                        success: false,
                        error: 'Division ID is required for refreshing transfers',
                    });
                }

                const { handleRefreshTransfers } = await import('./server/transfers-admin.server');
                result = await handleRefreshTransfers(divisionId);
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
        console.error(`❌ Admin action ${actionType ?? '(unread)'} failed:`, error);

        return data<AdminActionData>({
            success: false,
            error: describeActionFailure(error),
        });
    }
}

export default function AdminRoute() {
    const context = useLoaderData<AdminLoaderData>();

    return (
        <AdminLayout>
            {context.unknownDivisions ? (
                <output className={styles.unknownDivisions}>{context.unknownDivisions}</output>
            ) : null}
            <Outlet context={context} />
        </AdminLayout>
    );
}
