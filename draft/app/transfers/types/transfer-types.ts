/* Location: app/transfers/types/transfer-types.ts */
/** biome-ignore-all lint/style/useNamingConvention: <explanation> */

import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { TeamRoster } from '../../teams/types/team-types';

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
    'Transfer Type': 'Transfer' | 'swap' | 'loan start' | 'loan finish' | 'trade';
    Comment: string;
}
export interface ProcessedTransferSheetData {
    status: 'Y' | 'N' | null | string; // Y = approved, N = rejected, null/empty = pending
    timestamp: Date;
    manager: string; // userId
    transferOut: string; // player.web_name
    codeOut: number; // player.code
    transferIn: string; // player.web_name
    codeIn: number; // player.code
    transferType: 'Transfer' | 'swap' | 'loan start' | 'loan finish' | 'trade';
    comment: string;
}

/**
 * Processed transfer data for application logic
 */
export interface ProcessedTransfer {
    id: string; // Generated ID for tracking
    status: TransferStatus;
    timestamp: Date;
    managerId: string;
    transferType: TransferType;
    playerOut: EnhancedPlayerData;
    playerIn: EnhancedPlayerData;
    comment: string;
}

/**
 * Transfer status
 */
export type TransferStatus = 'APPROVED' | 'REJECTED' | 'PENDING';

/**
 * Transfer type
 */
export type TransferType = 'TRANSFER' | 'SWAP' | 'LOAN_START' | 'LOAN_FINISH' | 'TRADE' | 'NEW_PLAYER';

/**
 * Transfer processing result
 */
export interface TransferProcessingResult {
    processedCount: number;
    approvedTransfers: ProcessedTransfer[];
    rejectedTransfers: ProcessedTransfer[];
    pendingTransfers: ProcessedTransfer[];
    errors: TransferProcessingError[];
}

/**
 * Transfer processing error
 */
export interface TransferProcessingError {
    rowIndex: number;
    transfer: Partial<ProcessedTransferSheetData>;
    error: string;
    severity: 'warning' | 'error';
}

/**
 * Division transfer history
 */
export interface DivisionTransferHistory {
    divisionId: string;
    transfers: ProcessedTransfer[];
    lastUpdated: Date;
    gameweekRange: {
        from: number;
        to: number;
    };
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

/**
 * Gameweek transfer summary
 */
export interface GameweekTransferSummary {
    gameweek: number;
    divisionId: string;
    transferCount: number;
    affectedManagers: string[];
    transfersByType: Record<TransferType, number>;
    earliestTransfer: Date;
    latestTransfer: Date;
}
