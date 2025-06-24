/* Location: app/transfers/lib/transfer-validation.service.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { PlayersByCode } from '../../scoring/types/scoring-types';
import type { DivisionId, ManagerId, RosterByManagerId } from '../../teams/types/team-types';
import type {
    RuleValidationFunctions,
    RuleValidationResult,
    TransferRecommendation,
    TransferRule,
    TransferRuleContext,
    TransferValidationResult,
} from '../types/transfer-rule-types';
import type { ProcessedTransfer } from '../types/transfer-types';
import { validateGameweekTransferLimit } from './validators/gameweek-transfer-limit-validator';
import { validateMinimumGap } from './validators/min-time-between-validator';
import { validatePlayerAvailability } from './validators/player-availability-validator';
import { validatePositionCompatibility } from './validators/position-compatibility-validator';
import { validatePositionLimits } from './validators/position-limits-validator';

export interface EnhancedTransferValidationResult extends TransferValidationResult {
    virtualStateConflict?: {
        playerCode: number;
        playerName: string;
        conflictingWith: ManagerId;
        conflictingTransferId: string;
    };
}

/**
 * Sequential validation result for a batch of transfers
 */
export interface SequentialValidationResult {
    transferValidations: Array<{
        transfer: ProcessedTransfer;
        validation: EnhancedTransferValidationResult;
        recommendation: TransferRecommendation;
    }>;
    summary: {
        totalTransfers: number;
        approved: number;
        rejected: number;
        needsReview: number;
    };
}

/**
 * Validate a transfer against configured rules
 */
export async function validateTransfer(
    transfer: ProcessedTransfer,
    rules: TransferRule[],
    context: {
        allGameweekTransfers: ProcessedTransfer[];
        divisionRosters: RosterByManagerId;
        gameweekData: GameWeekData;
        fplPlayersByCode: PlayersByCode;
        divisionId: DivisionId;
        currentGameweek: number;
    },
): Promise<TransferValidationResult> {
    const ruleValidationFunctions = getRuleValidationFunctions();
    const ruleResults: RuleValidationResult[] = [];

    // Create validation context
    const validationContext: TransferRuleContext = {
        transfer,
        allGameweekTransfers: context.allGameweekTransfers,
        divisionRosters: context.divisionRosters,
        gameweekData: context.gameweekData,
        fplPlayersByCode: context.fplPlayersByCode,
        divisionId: context.divisionId,
        currentGameweek: context.currentGameweek,
    };

    // Filter rules applicable to this transfer type
    const applicableRules = rules.filter((rule) => rule.isActive && rule.transferTypes.includes(transfer.transferType));

    console.log(`📋 Found ${applicableRules.length} applicable rules for ${transfer.transferType}`);
    // console.log('context.divisionRosters');
    // Object.keys(context.divisionRosters).forEach((managerId) => {
    //     console.log(managerId);
    //     Object.keys(context.divisionRosters[managerId].roster).forEach((pos) => {
    //         const player = context.divisionRosters[managerId].roster[pos].player;
    //         console.log(player.playerPosition, player.playerName);
    //     });
    // });
    // Validate each applicable rule
    for (const rule of applicableRules) {
        try {
            const validationFunction = ruleValidationFunctions[rule.validationFunction];

            if (!validationFunction) {
                console.warn(`⚠️ Unknown validation function: ${rule.validationFunction}`);
                ruleResults.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    passed: false,
                    severity: rule.severity,
                    message: `Unknown validation function: ${rule.validationFunction}`,
                });
                continue;
            }

            const result = validationFunction(validationContext);
            result.severity = rule.severity; // Ensure severity matches rule config
            ruleResults.push(result);
        } catch (error) {
            console.error(`❌ Error validating rule ${rule.id}:`, error);
            ruleResults.push({
                ruleId: rule.id,
                ruleName: rule.name,
                passed: false,
                severity: rule.severity,
                message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }

    // Categorize results by severity
    const blockingFailures = ruleResults.filter((r) => !r.passed && r.severity === 'blocking');
    const warnings = ruleResults.filter((r) => !r.passed && r.severity === 'warning');
    const advisories = ruleResults.filter((r) => !r.passed && r.severity === 'advisory');

    // Determine overall validation result
    const isValid = blockingFailures.length === 0;

    // Determine recommendation
    let recommendation: TransferRecommendation;
    if (blockingFailures.length > 0) {
        recommendation = 'REJECT';
    } else if (warnings.length > 0) {
        recommendation = 'REVIEW';
    } else {
        recommendation = 'APPROVE';
    }

    // Create summary message
    const summary = createValidationSummary(ruleResults, recommendation);

    console.log(
        `✅ Transfer validation complete: ${recommendation === 'REJECT' ? '🚨' : ''} ${recommendation} (${ruleResults.length} rules checked)`,
    );
    ruleResults.forEach((result) => console.log(` . . . ${result.message}`));

    return {
        transferId: transfer.id,
        isValid,
        recommendation,
        ruleResults,
        blockingFailures,
        warnings,
        advisories,
        summary,
    };
}

export async function validateTransfers(
    transfers: ProcessedTransfer[],
    rules: TransferRule[],
    context: {
        allGameweekTransfers: ProcessedTransfer[];
        divisionRosters: RosterByManagerId;
        gameweekData: GameWeekData;
        fplPlayersByCode: PlayersByCode;
        divisionId: DivisionId;
        currentGameweek: number;
    },
): Promise<SequentialValidationResult> {
    console.log(`🔄 Starting sequential validation of ${transfers.length} transfers`);

    const transferValidations: SequentialValidationResult['transferValidations'] = [];
    const summary = {
        totalTransfers: transfers.length,
        approved: 0,
        rejected: 0,
        needsReview: 0,
    };

    // Process each transfer in sequence
    for (const transfer of transfers) {
        console.log(`📋 Validating transfer ${transfer.playerOut.web_name} → ${transfer.playerIn.web_name}`);

        // Run validation
        const validation = await validateTransfer(transfer, rules, context);

        // Update summary counts
        switch (validation.recommendation) {
            case 'APPROVE':
                summary.approved++;
                break;
            case 'REJECT':
                summary.rejected++;
                break;
            case 'REVIEW':
                summary.needsReview++;
                break;
        }

        transferValidations.push({
            transfer,
            validation: validation,
            recommendation: validation.recommendation,
        });
    }

    return {
        transferValidations,
        summary,
    };
}

/**
 * Create a human-readable summary of validation results
 */
function createValidationSummary(ruleResults: RuleValidationResult[], recommendation: TransferRecommendation): string {
    const passed = ruleResults.filter((r) => r.passed).length;
    const failed = ruleResults.filter((r) => !r.passed).length;

    if (recommendation === 'APPROVE') {
        return `All ${ruleResults.length} rules passed. Recommended for approval.`;
    }

    if (recommendation === 'REJECT') {
        const blocking = ruleResults.filter((r) => !r.passed && r.severity === 'blocking').length;
        return `${blocking} blocking rule${blocking > 1 ? 's' : ''} failed. Recommended for rejection.`;
    }

    // REVIEW
    const warnings = ruleResults.filter((r) => !r.passed && r.severity === 'warning').length;
    const advisories = ruleResults.filter((r) => !r.passed && r.severity === 'advisory').length;

    let summary = `${passed} rules passed, ${failed} failed. `;
    if (warnings > 0) {
        summary += `${warnings} warning${warnings > 1 ? 's' : ''}. `;
    }
    if (advisories > 0) {
        summary += `${advisories} advisory issue${advisories > 1 ? 's' : ''}. `;
    }
    summary += 'Manual review recommended.';

    return summary;
}

/**
 * Get all available rule validation functions
 */
function getRuleValidationFunctions(): RuleValidationFunctions {
    return {
        validateMinimumGap,
        validatePlayerAvailability,
        validatePositionLimits,
        validateGameweekTransferLimit,
        validatePositionCompatibility,
    };
}
