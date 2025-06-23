/* Location: app/transfers/types/transfer-rule-types.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { PlayersByCode } from '../../scoring/types/scoring-types';
import type { DivisionId, TeamRoster } from '../../teams/types/team-types';
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
    parameters: Record<string, unknown>;
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
 * Rule configuration for a division
 */
export interface DivisionRuleConfiguration {
    divisionId: DivisionId;
    rules: TransferRule[];
    lastUpdated: Date;
    version: number;
}

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
    defaultParameters: Record<string, unknown>;
    parameterSchema: Record<string, RuleParameterDefinition>;
}

/**
 * Rule parameter definition for configuration UI
 */
export interface RuleParameterDefinition {
    type: 'string' | 'number' | 'boolean' | 'date' | 'select';
    label: string;
    description: string;
    required: boolean;
    defaultValue: unknown;
    options?: Array<{ value: unknown; label: string }>; // For select type
    min?: number; // For number type
    max?: number; // For number type
}

/**
 * Transfer rule validation context
 */
export interface TransferRuleContext {
    transfer: ProcessedTransfer;
    divisionRosters: Record<DivisionId, TeamRoster>;
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
 * Rule configuration UI props
 */
export interface RuleConfigurationProps {
    divisionId: DivisionId;
    currentRules: TransferRule[];
    availableRules: BuiltInRuleDefinition[];
    onSaveRules: (rules: TransferRule[]) => Promise<void>;
    onTestRules: (rules: TransferRule[]) => Promise<TransferValidationResult[]>;
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

/**
 * Spreadsheet update operation for recommendations
 */
export interface TransferRecommendationUpdate {
    transferId: string;
    recommendation: TransferRecommendation;
    validationSummary: string;
    ruleViolations: string[];
    updatedBy: string;
    updatedAt: Date;
}
