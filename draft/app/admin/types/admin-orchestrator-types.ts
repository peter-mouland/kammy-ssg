// app/admin/types/admin-orchestrator-types.ts

import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { PlayersSheetData } from '../../_shared/types/sheets-types';
import type { DraftOrderData, DraftStateData } from '../../draft/types/draft-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { DivisionId, DivisionSheetData, UserTeamsSheetData } from '../../teams/types/team-types';
import type { ProcessedTransferSheetData } from '../../transfers/types/transfer-types';
import type { SystemStatusSummary } from './admin-types';

// ================================
// SYSTEM STATUS TYPES
// ================================
export interface SmartUpdateParams {
    forceRefresh?: boolean;
    skipValidation?: boolean;
}

export interface TransferStatusSummary {
    byDivision: Partial<
        Record<
            'leagueOne' | 'championship' | 'premierLeague',
            {
                pendingCount: number;
                approvedCount: number;
                rejectedCount: number;
            }
        >
    >;
}

export interface GameweekStatusSummary {
    currentGameweek: GameWeekData;
    lastProcessedGameweek: number;
    needsProcessing: boolean;
    pendingGameweeks: number[];
    lastProcessedAt: null;
    isProcessing: boolean;
}

// ================================
// DRAFT SYNC COMPARISON TYPES
// ================================

export interface DraftSyncComparison {
    divisionId: string;
    sheetsState: any;
    firebaseState: any;
    sheetsPicks: any[];
    firebasePicks: any[];
    differences: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
    }>;
    lastSyncedAt?: number;
}

// ================================
// SMART UPDATE TYPES
// ================================

export interface SmartUpdateResult {
    success: boolean;
    message: string;
    actionsPerformed: ActionPerformed[];
    errors: string[];
}

export interface ActionPerformed {
    action: 'syncDraft' | 'processGameweek' | 'refreshCache' | 'processTransfers';
    result: 'success' | 'failed' | 'skipped';
    message: string;
}

// ================================
// GAMEWEEK PROCESSING TYPES
// ================================

export interface GameweekResult {
    success: boolean;
    message: string;
    gameweek: number;
    transfersProcessed: number;
    pointsCalculated: number;
    standingsUpdated: boolean;
}

export interface AtomicGameweekProcessingParams {
    gameweek: number;
    fplData: FplDataContext;
    sheetData: SheetDataContext;
    transferStatus: TransferStatusSummary;
}

export interface AtomicGameweekProcessingResult {
    transfersProcessed: number;
    pointsCalculated: number;
    standingsUpdated: boolean;
    error?: string;
}

// ================================
// DRAFT ACTION TYPES
// ================================

export interface DraftAction {
    type: 'start' | 'sync' | 'commit' | 'reset';
    divisionId?: DivisionId;
}

export interface DraftResult {
    success: boolean;
    message: string;
    data?: any;
}

// ================================
// SHARED DATA CONTEXT TYPES
// ================================
export type TransferByDivisionId = Record<DivisionId, ProcessedTransferSheetData[]>;

export interface AdminDataContext {
    fplData: FplDataContext;
    sheetData: SheetDataContext;
    cacheStatus: CacheStatusContext;
    draftSyncComparisons?: DraftSyncComparison[] | null; // NEW: Draft sync comparison data
    loadedAt: string;
}

export interface FplDataContext {
    players: EnhancedPlayerData[];
    teams: FplTeam[];
    events: GameWeekData[];
    currentGameweek: number;
}

export interface SheetDataContext {
    divisions: DivisionSheetData[];
    managers: UserTeamsSheetData[];
    players: PlayersSheetData[];
    draftStates: DraftStateData[];
    draftOrder: Record<DivisionId, DraftOrderData[]>;
    transfers: TransferByDivisionId;
}

export interface CacheStatusContext {
    health: 'healthy' | 'warning' | 'unhealthy' | 'unknown';
    completionPercentage: number;
    lastUpdated: string | null;
}

// ================================
// UI COMPONENT TYPES
// ================================

export interface AdminTabConfig {
    id: string;
    label: string;
    icon: React.ReactNode;
    component: React.ComponentType<AdminTabProps>;
    description: string;
}

export interface AdminTabProps {
    systemStatus: SystemStatusSummary;
    onExecuteAction: (action: AdminActionRequest) => Promise<void>;
    isLoading: boolean;
}

export interface AdminActionRequest {
    type: 'smartUpdate' | 'processGameweek' | 'syncDraft' | 'refreshCache' | 'resetDatabase';
    params?: Record<string, any>;
}

// ================================
// DASHBOARD TYPES
// ================================

export interface DashboardSummary {
    systemHealth: 'healthy' | 'warning' | 'critical';
    pendingActions: PendingAction[];
    quickStats: QuickStats;
    lastUpdate: string;
}

export interface PendingAction {
    type: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime: string;
}

export interface QuickStats {
    activeManagers: number;
    pendingTransfers: number;
    currentGameweek: number;
    systemUptime: string;
}

// ================================
// ERROR HANDLING TYPES
// ================================

export interface AdminError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
}

export interface AdminOperationResult<T = any> {
    success: boolean;
    data?: T;
    error?: AdminError;
    warnings?: string[];
}

// ================================
// CONFIGURATION TYPES
// ================================

export interface AdminOrchestratorConfig {
    contextCacheMinutes: number;
    maxRetries: number;
    timeoutSeconds: number;
    enableDetailedLogging: boolean;
}

// ================================
// AUDIT TYPES
// ================================

export interface AdminAction {
    id: string;
    type: string;
    performedBy: string;
    performedAt: string;
    parameters: Record<string, any>;
    result: 'success' | 'failure' | 'partial';
    duration: number;
    affectedRecords?: number;
}

export interface AdminAuditLog {
    actions: AdminAction[];
    totalCount: number;
    page: number;
    pageSize: number;
}
