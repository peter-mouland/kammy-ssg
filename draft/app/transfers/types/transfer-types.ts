import type { ProcessedTransferSheetData, TransferSheetData } from '../../_shared/types/sheets-types';

export type { ProcessedTransferSheetData, TransferSheetData };

/* Location: app/transfers/types/transfer-types.ts */
/** biome-ignore-all lint/style/useNamingConvention: <init> */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { ManagerId } from '../../_shared/types/league-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { TeamRoster } from '../../_shared/types/squad-types';

/**
 * Raw transfer data from Google Sheets
 */

/**
 * Processed transfer data for application logic
 */
export interface ProcessedTransfer {
    id: string; // Generated ID for tracking
    status: TransferStatus;
    timestamp: Date;
    managerId: ManagerId;
    transferType: TransferType;
    playerOut: EnhancedPlayerData;
    playerIn: EnhancedPlayerData;
    comment: string;
    gameweekData: GameWeekData;

    // Loan-specific fields (user IDs)
    onLoanTo?: string; // User ID of manager receiving the loan
    onLoanFrom?: string; // User ID of manager lending the player
}

/**
 * Transfer status
 */
export type TransferStatus = 'APPROVED' | 'REJECTED' | 'PENDING';

/**
 * Transfer type
 */
export type TransferType = 'TRANSFER' | 'SWAP' | 'LOAN_START' | 'LOAN_END' | 'TRADE' | 'NEW_PLAYER';

/**
 * Transfer processing result
 */
export interface TransferProcessingResult {
    processedCount: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    transfers: ProcessedTransfer[];
    errors: TransferProcessingError[];
}

/**
 * Transfer processing error
 */
interface TransferProcessingError {
    rowIndex: number;
    transfer: Partial<ProcessedTransferSheetData>;
    error: string;
    severity: 'warning' | 'error';
}

/**
 * Transfer application result for roster updates
 */
export interface TransferApplicationResult {
    rosterId: string; // userId
    positionSlot: string; // PositionSlotKey
    playerBefore: EnhancedPlayerData | null;
    playerAfter: EnhancedPlayerData;
    transferId: string;
    appliedAt: Date;
    updatedRoster: TeamRoster;
}
