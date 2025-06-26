/* Location: app/transfers/types/transfer-form-types.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type {
    DivisionId,
    DivisionSheetData,
    ManagerId,
    RosterPlayer,
    TeamRoster,
    UserTeamsSheetData,
} from '../../teams/types/team-types';
import type { TransferRecommendation } from './transfer-rule-types';
import type { ProcessedTransfer, TransferType } from './transfer-types';

/**
 * Data structure for the transfers page
 */
export interface TransfersPageData {
    divisions: DivisionSheetData[];
    managers: UserTeamsSheetData[];
    currentGameweek: number;
    availableGameweeks: number[];
    gameweekData: GameWeekData;
    selectedDivision: DivisionId;
    selectedManager: ManagerId;
    selectedGameweek: number;
    currentTransfers: Array<{
        transfer: ProcessedTransfer;
        validation: TransferValidationResult;
        recommendation: TransferRecommendation;
    }>;
    managerRoster?: TeamRoster;
    availablePlayers: EnhancedPlayerData[];
    transferDeadline: string;
    isBeforeDeadline: boolean;
}

/**
 * Division information for dropdowns
 */
export interface Division {
    id: DivisionId;
    name: string;
    isActive: boolean;
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
 * Player selection state for form
 */
export interface PlayerSelectionState {
    playerOut: RosterPlayer | null;
    playerIn: EnhancedPlayerData | null;
    transferType: TransferType;
}

/**
 * Player eligibility for transfer in
 */
export interface PlayerEligibility {
    isEligible: boolean;
    reason?: string;
    icon?: string;
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

/**
 * Form submission state
 */
export interface TransferSubmissionState {
    isSubmitting: boolean;
    hasSubmitted: boolean;
    error?: string;
    success?: boolean;
}
