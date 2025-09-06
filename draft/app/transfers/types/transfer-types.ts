/* Location: app/transfers/types/transfer-types.ts */
/** biome-ignore-all lint/style/useNamingConvention: <init> */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { ManagerId, TeamRoster } from '../../teams/types/team-types';

/**
 * Raw transfer data from Google Sheets
 */
export interface TransferSheetData {
    Status: 'Y' | 'N' | null | string; // Y = approved, N = rejected, null/empty = pending
    Timestamp: Date;
    Manager: string; // userId
    'Transfer Out': string; // player.web_name
    'Code Out': number; // player.code
    'Transfer In': string; // player.web_name
    'Code In': number; // player.code
    'Transfer Type': 'Transfer' | 'swap' | 'loan start' | 'loan end' | 'trade' | 'new player';
    Comment: string;
    'Loan To': string; // userId of manager receiving the loan (NEW)
    'Loan From': string; // userId of manager lending the player (NEW)
}
export interface ProcessedTransferSheetData {
    status: 'Y' | 'N' | null | string; // Y = approved, N = rejected, null/empty = pending
    timestamp: Date;
    manager: string; // userId
    transferOut: string; // player.web_name
    codeOut: number; // player.code
    transferIn: string; // player.web_name
    codeIn: number; // player.code
    transferType: 'Transfer' | 'swap' | 'loan start' | 'loan end' | 'trade' | 'new player';
    comment: string;
    loanTo: string; // userId of manager receiving the loan (NEW)
    loanFrom: string; // userId of manager lending the player (NEW)
}

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
