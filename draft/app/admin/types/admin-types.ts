/* Location: app/admin/types/admin-types.ts */

import type { DraftOrderData, DraftStateData } from '../../draft/types/draft-types';
// Import types from their proper domains
import type { DivisionId, DivisionSheetData, UserTeamsSheetData } from '../../teams/types/team-types';

// ==========================================
// ADMIN DASHBOARD DATA TYPES
// ==========================================

export interface AdminDashboardData {
    divisions: DivisionSheetData[];
    draftOrders: Record<string, DraftOrderData[]>;
    userTeamsByDivision: Record<string, UserTeamsSheetData[]>;
    draftState: DraftStateData | null;
}

// ==========================================
// ADMIN NAVIGATION TYPES
// ==========================================

export type AdminSectionKey = 'overview' | 'draft' | 'transfers' | 'points' | 'settings';

export interface AdminNavItem {
    key: AdminSectionKey;
    label: string;
    icon: React.ReactNode;
    path: string;
}

// ==========================================
// ADMIN ACTION TYPES
// ==========================================

export type AdminActionType =
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
    | 'forceRerunTransfers'
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

export type ClearVariant = 'all' | 'fpl-only' | 'elements-only';

export interface AdminActionParams {
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

export interface SystemStatusSummary {
    currentGameweek: number;
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
    draft: {
        isActive: boolean;
        currentDivisionId: string | null;
        currentUserId: string | null;
        currentPick: number | null;
        byDivision: Record<
            string,
            {
                hasOrder: boolean;
                isActive: boolean;
                isCurrentDivision: boolean;
                orderExists: boolean;
            }
        >;
    };
    gameweekProcessing: {
        currentGameweek: number;
        lastProcessedGameweek: number | null;
        totalGameweeks: number;
        processedGameweeks: number[];
        pendingGameweeks: number[];
        isUpToDate: boolean;
        completionPercentage: number;
    };
    recommendations: string[];
}
