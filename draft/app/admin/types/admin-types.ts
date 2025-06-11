// /admin/types/admin-types.ts
import type {
    DivisionData,
    UserTeamData,
    DraftOrderData,
    DraftStateData
} from '../../_shared/types';

// ==========================================
// ADMIN DASHBOARD DATA TYPES
// ==========================================

export interface AdminDashboardData {
    divisions: DivisionData[];
    draftOrders: Record<string, DraftOrderData[]>;
    userTeamsByDivision: Record<string, UserTeamData[]>;
    draftState: DraftStateData | null;
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
    | 'clearFirestoreData'
    | 'getFirestoreStats'
    | 'getCacheStatus'
    | 'populateBootstrapData'
    | 'generateEnhancedDataFast'
    | 'populateElementSummaries'
    | 'generateGameWeekPoints'
    | 'forceRegenerateAllPoints'
    | 'getGameweekPointsStatus';

export type ClearVariant = 'all' | 'fpl-only' | 'elements-only';

export interface AdminActionParams {
    actionType: AdminActionType;
    divisionId?: string;
    authToken?: string;
    variant?: ClearVariant;
}

export interface AdminActionResult {
    success: boolean;
    error?: string;
    message?: string;
    data?: any;
}

// ==========================================
// COMPATIBILITY TYPES (for original code)
// ==========================================

// Keep these for backward compatibility with existing code
export type DraftActionParams = AdminActionParams;
export type ActionResult = AdminActionResult;
