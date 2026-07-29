/* Location: app/admin/types/admin-types.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { DivisionId, DivisionSheetData, UserTeamsSheetData } from '../../_shared/types/league-types';
import type { DraftOrderData, DraftStateData, DraftStatusData } from '../../draft';

// ==========================================
// ADMIN DASHBOARD DATA TYPES
// ==========================================

export interface AdminDashboardData {
    divisions: DivisionSheetData[];
    draftOrders: Record<string, DraftOrderData[]>;
    managers: UserTeamsSheetData[];
    draftState: DraftStateData | null;
    draftStatus: DraftStatusData | null;
}

// ==========================================
// ADMIN NAVIGATION TYPES
// ==========================================

type AdminSectionKey = 'overview' | 'draft' | 'transfers' | 'points' | 'settings' | 'setupNewSeason';

export interface AdminNavItem {
    key: AdminSectionKey;
    label: string;
    icon: React.ReactNode;
    path: string;
}

// ==========================================
// ADMIN ACTION TYPES
// ==========================================

type AdminActionType =
    | 'generateOrder'
    | 'clearOrder'
    | 'startDraft'
    | 'stopDraft'
    | 'syncDraft'
    | 'invalidateDraftCache'
    | 'commitTeamsToFirestore'
    | 'getDraftPicksCount'
    | 'clearFirestoreData'
    | 'getFirestoreStats'
    | 'getCacheStatus'
    | 'populateBootstrapData'
    | 'generateEnhancedDataFast'
    | 'populateElementDetailedStats'
    | 'generateGameWeekPoints'
    | 'forceRegenerateAllPoints'
    | 'ensureDivisionDocument'
    | 'resetDraft'
    | 'autoCommitTeamsToFirestore'
    | 'getGameweekPointsStatus'
    // Transfer-specific actions
    | 'refreshTransfers'
    | 'validateAllTransfers'
    | 'approveTransfer'
    | 'rejectTransfer'
    | 'updateTransferRules'
    | 'ensureRecommendationColumns'
    | 'clearTransferRecommendations'
    | 'getTransferHistory';

type ClearVariant = 'all' | 'fpl-only' | 'elements-only';

interface AdminActionParams {
    actionType: AdminActionType;
    divisionId?: DivisionId;
    authToken?: string;
    variant?: ClearVariant;
    // Transfer-specific parameters
    transferId?: string;
    recommendation?: 'APPROVE' | 'REJECT' | 'REVIEW';
    rules?: unknown[];
}

/**
 * What the /admin route's action returns to the browser.
 *
 * Wider than AdminActionResult, which is what an individual service returns: the route
 * also fronts long-running jobs, which reply with a jobId to poll instead of a message.
 */
export interface AdminActionData {
    success: boolean;
    message?: string;
    error?: string;
    data?: unknown;
    /** Present when the action started a background job the client should poll. */
    jobId?: string;
}

export interface AdminActionResult {
    success: boolean;
    error?: string;
    message: string;
    data?: unknown;
}

// ==========================================
// COMPATIBILITY TYPES (for original code)
// ==========================================

// Keep these for backward compatibility with existing code
export type DraftActionParams = AdminActionParams;

export type HealthLevel = 'healthy' | 'warning' | 'critical';

/** A connection check: can we reach Firebase / Google Sheets, and the overall roll-up. */
export interface SystemHealthStatus {
    status: HealthLevel;
    message: string;
}

/**
 * How complete the FPL cache is.
 *
 * NOT a SystemHealthStatus, though it was typed as one. A connection check reports a
 * message; this reports which datasets are missing and how far through we are. The two
 * only share `status`, which is why the roll-up takes just that field.
 */
export interface FplCacheHealth {
    status: HealthLevel;
    data: {
        completionPercentage: number;
        counts: {
            elements: number;
            events: number;
            teams: number;
            elementDetailedStats: number;
        };
        missing: {
            elements: boolean;
            events: boolean;
            teams: boolean;
            elementDetailedStats: boolean;
            draftData: boolean;
        };
    };
}

export interface SystemStatusSummary {
    currentGameweek: GameWeekData;
    bootstrapLastUpdated: string | null;
    systemHealth: {
        fplCache: FplCacheHealth;
        firebase: SystemHealthStatus;
        googleSheets: SystemHealthStatus;
        overall: SystemHealthStatus;
    };
    transfers: {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
        byDivision: Record<
            string,
            {
                pending: number;
                approved: number;
                rejected: number;
                total: number;
            }
        >;
    };
    draft: DraftStatusData;
    gameweekProcessing: {
        currentGameweek: GameWeekData;
        lastProcessedGameweek: number;
        totalGameweeks: number;
        processedGameweeks: number[];
        pendingGameweeks: number[];
        isUpToDate: boolean;
        needsProcessing: boolean;
        completionPercentage: number;
        lastProcessedAt: null;
    };
    recommendations: string[];
}
