/* Location: app/admin/types/admin-types.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { DraftOrderData, DraftStateData, DraftStatusData } from '../../draft/types/draft-types';
import type { DivisionId, DivisionSheetData, UserTeamsSheetData } from '../../teams/types/team-types';

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

type AdminSectionKey = 'overview' | 'draft' | 'transfers' | 'points' | 'settings';

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

export interface SystemHealthStatus {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
}

type DraftDivisionStatus = {
    doesDraftOrderExists: boolean;
    pickCount: number;
    picksRemaining: number;
    isCommitted: boolean;
};

export type DraftStatusByDivisionId = Record<DivisionId, DraftDivisionStatus>;

export interface SystemStatusSummary {
    currentGameweek: GameWeekData;
    systemHealth: {
        fplCache: SystemHealthStatus;
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
