// app/transfers/types/transfer-form-types.ts

import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type {
    DivisionId,
    DivisionSheetData,
    ManagerId,
    PositionSlotKey,
    RosterByManagerId,
    RosterPlayer,
    TeamPositionSlot,
    TeamRoster,
    UserTeamsSheetData,
} from '../../teams/types/team-types';
import type { TransferRecommendation, TransferRuleContext } from './transfer-rule-types';
import type { ProcessedTransfer, TransferType } from './transfer-types';

export type OwnedPlayersByCode = Record<
    RosterPlayer['playerCode'],
    {
        managerId: ManagerId;
        slotKey: PositionSlotKey;
        slot: TeamPositionSlot;
    }
>;

/**
 * Transfer form submission data - UPDATED with loan fields
 */
export interface TransferFormData {
    divisionId: DivisionId;
    managerId: ManagerId;
    transferType: TransferType;
    playerOutCode: number;
    playerInCode: number;
    comment: string;
    // Loan-specific fields (NEW)
    onLoanTo?: string; // User ID of manager receiving the loan
    onLoanFrom?: string; // User ID of manager lending the player
}

/**
 * Player selection state for form - ENHANCED with loan context
 */
export interface PlayerSelectionState {
    playerOut: RosterPlayer | null;
    playerIn: EnhancedPlayerData | null;
    // Loan-specific state (NEW)
    loanContext?: {
        isLoanRequest: boolean;
        targetManagerId?: string;
        targetManagerName?: string;
        requiresBilateralAgreement: boolean;
    };
}

/**
 * Player eligibility for transfer in - ENHANCED for loans
 */
export interface PlayerEligibility {
    isEligible: boolean;
    reason?: string;
    icon?: string;
    // Loan-specific eligibility (NEW)
    loanInfo?: {
        currentOwner?: string;
        canLoan: boolean;
        loanRestictions?: string[];
    };
}

/**
 * Data structure for the transfers page
 */
export interface TransfersPageData {
    divisions: DivisionSheetData[];
    managers: UserTeamsSheetData[];
    currentGameweek: number;
    selectedGameweek: number;
    currentGameweekData: GameWeekData;
    selectedGameweekData: GameWeekData;
    availableGameweeks: number[];
    gameweekData: GameWeekData;
    selectedDivision: DivisionId;
    selectedManager: ManagerId;
    currentTransfers: Array<{
        transfer: ProcessedTransfer;
        validation: TransferValidationResult;
        recommendation: TransferRecommendation;
    }>;
    managerRoster?: TeamRoster;
    availablePlayers: EnhancedPlayerData[];
    transferDeadline: string;
    isBeforeDeadline: boolean;
    // Enhanced with loan tracking (NEW)
    pendingLoans?: PendingLoanRequest[];
    activeLoanAgreements?: ActiveLoanAgreement[];
    divisionRosters: RosterByManagerId;
    teamsByCode: Record<FplTeam['code'], FplTeam>;
    validationContext: Omit<TransferRuleContext,'transfer'>,
}

/**
 * Pending loan request tracking (NEW)
 */
export interface PendingLoanRequest {
    id: string;
    requestingManager: ManagerId;
    targetManager: ManagerId;
    playerOut: EnhancedPlayerData;
    playerIn: EnhancedPlayerData;
    timestamp: Date;
    needsMatchingRequest: boolean;
}

/**
 * Active loan agreement tracking (NEW)
 */
export interface ActiveLoanAgreement {
    id: string;
    lendingManager: ManagerId;
    borrowingManager: ManagerId;
    loanedPlayer: EnhancedPlayerData;
    exchangedPlayer?: EnhancedPlayerData;
    startDate: Date;
    status: 'ACTIVE' | 'ENDING';
}

/**
 * Manager information for dropdowns
 */
export interface Manager {
    id: ManagerId;
    name: string;
    divisionId: DivisionId;
    email?: string;
}

/**
 * Transfer form submission data
 */
export interface TransferFormData {
    divisionId: DivisionId;
    managerId: ManagerId;
    transferType: TransferType;
    playerOutCode: number;
    playerInCode: number;
    comment: string;
}

/**
 * Transfer validation result
 */
export interface TransferValidationResult {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    blockingIssues: string[];
}
