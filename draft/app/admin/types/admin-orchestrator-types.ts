// app/admin/types/admin-orchestrator-types.ts

import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { DivisionId, DivisionSheetData, UserTeamsSheetData } from '../../_shared/types/league-types';
import type { DraftStateRow, PlayersSheetData } from '../../_shared/types/sheets-types';
import type { DraftOrderData } from '../../draft/types/draft-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { ProcessedTransferSheetData } from '../../transfers/types/transfer-types';

// ================================
// DRAFT SYNC COMPARISON TYPES
// ================================

interface DraftSyncComparison {
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

export interface DraftResult {
    success: boolean;
    message: string;
    data?: any;
}

// ================================
// SHARED DATA CONTEXT TYPES
// ================================
type TransferByDivisionId = Record<DivisionId, ProcessedTransferSheetData[]>;

export interface AdminDataContext {
    fplData: FplDataContext;
    sheetData: SheetDataContext;
    cacheStatus: CacheStatusContext;
    draftSyncComparisons?: DraftSyncComparison[] | null; // NEW: Draft sync comparison data
    loadedAt: string;
}

interface FplDataContext {
    players: EnhancedPlayerData[];
    teams: FplTeam[];
    events: GameWeekData[];
    currentGameweek: number;
}

interface SheetDataContext {
    divisions: DivisionSheetData[];
    managers: UserTeamsSheetData[];
    players: PlayersSheetData[];
    draftStates: DraftStateRow[];
    draftOrder: Record<DivisionId, DraftOrderData[]>;
    transfers: TransferByDivisionId;
}

interface CacheStatusContext {
    health: 'healthy' | 'warning' | 'unhealthy' | 'unknown';
    completionPercentage: number;
    lastUpdated: string | null;
}
