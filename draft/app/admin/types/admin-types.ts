// app/admin/types/admin-types.ts

// Import types from their proper domains
import type {
    DivisionSheetData,
    UserTeamData
} from '../../teams/types/team-types';

import type {
    DraftOrderData,
    DraftStateData
} from '../../draft/types/draft-types';

// ==========================================
// ADMIN DASHBOARD DATA TYPES
// ==========================================

export interface AdminDashboardData {
    divisions: DivisionSheetData[];
    draftOrders: Record<string, DraftOrderData[]>;
    userTeamsByDivision: Record<string, UserTeamData[]>;
    draftState: DraftStateData | null;
}

// ==========================================
// ADMIN NAVIGATION TYPES
// ==========================================

export type AdminSectionKey = 'overview' | 'draft' | 'points' | 'settings';

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
    | 'populateElementSummaries'
    | 'generateGameWeekPoints'
    | 'forceRegenerateAllPoints'
    | 'ensureDivisionDocument'
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
    data?: unknown; // FIXED: was 'any'
}

// ==========================================
// COMPATIBILITY TYPES (for original code)
// ==========================================

// Keep these for backward compatibility with existing code
export type DraftActionParams = AdminActionParams;
export type ActionResult = AdminActionResult;
