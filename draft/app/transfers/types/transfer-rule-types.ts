/* Location: app/transfers/types/transfer-rule-types.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { PlayersByCode } from '../../scoring/types/scoring-types';
import type { DivisionId, RosterByManagerId } from '../../teams/types/team-types';
import type { ProcessedTransfer } from './transfer-types'; // Business/league rules

/**
 * Rule severity affects recommendation
 */
type RuleSeverity =
    | 'blocking' // Must pass, auto-reject if failed
    | 'warning' // Should pass, recommend reject if failed
    | 'advisory'; // Nice to pass, note if failed

/**
 * Rule validation result
 */
export interface RuleValidationResult {
    ruleId: string;
    ruleName: string;
    passed: boolean;
    severity: RuleSeverity;
    message: string;
    details?: Record<string, unknown>;
}

/**
 * Complete transfer validation result
 */
export interface TransferValidationResult {
    transferId: string;
    isValid: boolean;
    recommendation: TransferRecommendation;
    ruleResults: RuleValidationResult[];
    blockingFailures: RuleValidationResult[];
    warnings: RuleValidationResult[];
    advisories: RuleValidationResult[];
    summary: string;
}

/**
 * Admin recommendation for transfer
 */
export type TransferRecommendation = 'APPROVE' | 'REJECT' | 'REVIEW';

/**
 * Transfer rule validation context
 */
export interface TransferRuleContext {
    allGameweekTransfers: ProcessedTransfer[];
    transfer: ProcessedTransfer;
    divisionRosters: RosterByManagerId;
    gameweekData: GameWeekData;
    fplPlayersByCode: PlayersByCode;
    divisionId: DivisionId;
    currentGameweek: number;
}

/**
 * Transfer admin overview data
 */
export interface TransferAdminOverviewData {
    divisionId: DivisionId;
    transfers: Array<{
        transfer: ProcessedTransfer;
        validation: TransferValidationResult;
        recommendation: TransferRecommendation;
    }>;
    statusStats: {
        rejectedCount: number;
        approvedCount: number;
        processedCount: number;
        pendingCount: number;
    };
    validationStats: {
        totalValidated: number;
        autoApproved: number;
        autoRejected: number;
        needsReview: number;
    };
    divisionRosters: RosterByManagerId;
    validationContext: TransferRuleContext;
}
