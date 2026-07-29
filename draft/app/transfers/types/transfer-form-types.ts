// app/transfers/types/transfer-form-types.ts

import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type {
    DivisionId,
    DivisionSheetData,
    ManagerId,
    PositionSlotKey,
    UserTeamsSheetData,
} from '../../_shared/types/league-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { RosterPlayer, TeamPositionSlot, TeamRoster } from '../../_shared/types/squad-types';
import type { RosterByManagerId } from '../../teams/types/team-types';
import type { TransferRecommendation, TransferRuleContext, TransferValidationResult } from './transfer-rule-types';
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
    fullMessage?: string;
    // Loan-specific eligibility (NEW)
    loanInfo?: {
        currentOwner?: string;
        canLoan: boolean;
        loanRestictions?: string[];
    };
}

/** Who currently owns a player, if anyone. */
export interface PlayerOwnership {
    isOwned: boolean;
    ownerId?: string;
    ownerName?: string;
}

/**
 * An available player, decorated with the transfer-specific columns the "player in"
 * selector renders. The selector builds these by mapping over availablePlayers, so the
 * table's columns must be typed against this rather than plain EnhancedPlayerData --
 * otherwise `player.eligibility` is invisible to the type checker.
 */
export interface SelectablePlayer extends EnhancedPlayerData {
    eligibility: PlayerEligibility;
    ownership: PlayerOwnership;
}

/**
 * Data structure for the transfers page
 */
export interface TransfersPageData {
    persistedUser: { selectedUserId: ManagerId | null; requiresSelection: boolean };
    divisions: DivisionSheetData[];
    managers: UserTeamsSheetData[];
    currentGameweek: number;
    selectedGameweek: number;
    currentGameweekData: GameWeekData;
    selectedGameweekData: GameWeekData;
    availableGameweeks: number[];
    gameweekData: GameWeekData;
    selectedDivision: DivisionId;
    selectedUser: ManagerId;
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
    fplPlayersByCode?: Record<number, EnhancedPlayerData>;
    teamsByCode: Record<FplTeam['code'], FplTeam>;
    validationContext: Omit<TransferRuleContext, 'transfer'>;
}

/**
 * Pending loan request tracking (NEW)
 */
interface PendingLoanRequest {
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
interface ActiveLoanAgreement {
    id: string;
    lendingManager: ManagerId;
    borrowingManager: ManagerId;
    loanedPlayer: EnhancedPlayerData;
    exchangedPlayer?: EnhancedPlayerData;
    startDate: Date;
    status: 'ACTIVE' | 'ENDING';
}

/**
 * Live validation state shown in the transfer form as the manager fills it in.
 *
 * NOT the same as TransferValidationResult in transfer-rule-types.ts, which is what the
 * rules engine produces for an admin to act on. This one is plain strings for display;
 * that one carries the rule results, severities and a recommendation. They were both
 * called TransferValidationResult, which produced "Type 'TransferValidationResult' is
 * not assignable to type 'TransferValidationResult'" wherever the two met.
 */
export interface TransferFormValidation {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    blockingIssues: string[];
}
