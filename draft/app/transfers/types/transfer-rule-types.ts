/* Location: app/transfers/types/transfer-rule-types.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { PlayersByCode } from '../../scoring/types/scoring-types';
import type { DivisionId, RosterByManagerId } from '../../teams/types/team-types';
import type { ProcessedTransfer, TransferType } from './transfer-types';

/**
 * Individual rule definition
 */
export interface TransferRule {
    id: string;
    name: string;
    description: string;
    category: TransferRuleCategory;
    severity: RuleSeverity;
    isActive: boolean;
    transferTypes: TransferType[];
    validationFunction: string; // Function name to call for validation
}

/**
 * Rule categories for organization
 */
export type TransferRuleCategory =
    | 'timing' // When transfers can happen
    | 'eligibility' // Who can be transferred
    | 'roster' // Roster composition rules
    | 'gameweek' // Gameweek-specific rules
    | 'position' // Position-specific rules
    | 'business'; // Business/league rules

/**
 * Rule severity affects recommendation
 */
export type RuleSeverity =
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
 * Built-in rule definitions
 */
export interface BuiltInRuleDefinition {
    id: string;
    name: string;
    description: string;
    category: TransferRuleCategory;
    defaultSeverity: RuleSeverity;
    applicableTransferTypes: TransferType[];
    validationFunction: string;
}

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
 * Rule validation function signature
 */
export type RuleValidationFunction = (
    context: TransferRuleContext,
    parameters: Record<string, unknown>,
) => RuleValidationResult;

/**
 * Available rule validation functions
 */
export interface RuleValidationFunctions {
    [functionName: string]: RuleValidationFunction;
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
    ruleStats: {
        totalRules: number;
        activeRules: number;
        blockingRules: number;
        warningRules: number;
    };
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
}
