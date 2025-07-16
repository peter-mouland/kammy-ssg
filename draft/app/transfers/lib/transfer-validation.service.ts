/* Location: app/transfers/lib/transfer-validation.service.ts */

import type { ManagerId } from '../../teams/types/team-types';
import type {
    RuleValidationFunctions,
    RuleValidationResult,
    TransferRecommendation,
    TransferRule,
    TransferRuleContext,
    TransferValidationResult,
} from '../types/transfer-rule-types';
import type { ProcessedTransfer } from '../types/transfer-types';
import { getRuleValidationFunctions } from './validators';

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
    context: Omit<TransferRuleContext,'transfer'>,
): Promise<TransferValidationResult> {
    // Create validation context
    const validationContext: TransferRuleContext = {
        transfer,
        allGameweekTransfers: context.allGameweekTransfers,
        divisionRosters: context.divisionRosters,
        gameweekData: context.gameweekData,
        fplPlayersByCode: context.fplPlayersByCode,
        divisionId: context.divisionId,
        currentGameweek: context.currentGameweek,
        ownedPlayersByCode: context.ownedPlayersByCode,
    };

    // Filter rules applicable to this transfer type
    const ruleValidationResults = getRuleValidationFunctions(validationContext);

    console.log(`📋 Found ${ruleValidationResults.length} applicable rules for ${transfer.transferType}`);

    // Categorize results by severity
    const blockingFailures = ruleValidationResults.filter((r) => !r.passed && r.severity === 'blocking');
    const warnings = ruleValidationResults.filter((r) => !r.passed && r.severity === 'warning');
    const advisories = ruleValidationResults.filter((r) => !r.passed && r.severity === 'advisory');

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
    const summary = createValidationSummary(ruleValidationResults, recommendation);

    console.log(
        `✅ Transfer validation complete: ${recommendation === 'REJECT' ? '🚨' : ''} ${recommendation} (${ruleValidationResults.length} rules checked)`,
    );
    ruleValidationResults.forEach((result) => console.log(` . . . ${result.message}`));

    return {
        transferId: transfer.id,
        isValid,
        recommendation,
        ruleResults: ruleValidationResults,
        blockingFailures,
        warnings,
        advisories,
        summary,
    };
}

export async function validateTransfers(
    transfers: ProcessedTransfer[],
    context: Omit<TransferRuleContext,'transfer'>,
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
        const validation = await validateTransfer(transfer, context);

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


