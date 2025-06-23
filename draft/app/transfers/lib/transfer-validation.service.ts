/* Location: app/transfers/lib/transfer-validation.service.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { PlayersByCode } from '../../scoring/types/scoring-types';
import type { DivisionId, TeamRoster } from '../../teams/types/team-types';
import type {
    RuleValidationFunctions,
    RuleValidationResult,
    TransferRecommendation,
    TransferRule,
    TransferRuleContext,
    TransferValidationResult,
} from '../types/transfer-rule-types';
import type { ProcessedTransfer } from '../types/transfer-types';

/**
 * Validate a transfer against configured rules
 */
export async function validateTransfer(
    transfer: ProcessedTransfer,
    rules: TransferRule[],
    context: {
        divisionRosters: Record<DivisionId, TeamRoster>;
        gameweekData: GameWeekData;
        fplPlayersByCode: PlayersByCode;
        divisionId: DivisionId;
        currentGameweek: number;
    },
): Promise<TransferValidationResult> {
    console.log(`🔍 Validating transfer ${transfer.id} against ${rules.length} rules`);

    const ruleValidationFunctions = getRuleValidationFunctions();
    const ruleResults: RuleValidationResult[] = [];

    // Create validation context
    const validationContext: TransferRuleContext = {
        transfer,
        divisionRosters: context.divisionRosters,
        gameweekData: context.gameweekData,
        fplPlayersByCode: context.fplPlayersByCode,
        divisionId: context.divisionId,
        currentGameweek: context.currentGameweek,
    };

    // Filter rules applicable to this transfer type
    const applicableRules = rules.filter((rule) => rule.isActive && rule.transferTypes.includes(transfer.transferType));

    console.log(`📋 Found ${applicableRules.length} applicable rules for ${transfer.transferType}`);

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

            const result = validationFunction(validationContext, rule.parameters);
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

    console.log(`✅ Transfer validation complete: ${recommendation} (${ruleResults.length} rules checked)`);

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
        validateGameweekDeadline,
        validateMinimumGap,
        validatePlayerAvailability,
        validateInjuryStatus,
        validatePositionLimits,
        validateSquadSize,
        validateGameweekTransferLimit,
        validatePositionCompatibility,
        validateManagerActiveStatus,
        validateLeagueRestrictions,
    };
}

// ==========================================
// INDIVIDUAL VALIDATION FUNCTIONS
// ==========================================

/**
 * Validate gameweek deadline
 */
function validateGameweekDeadline(
    context: TransferRuleContext,
    parameters: Record<string, unknown>,
): RuleValidationResult {
    const hoursBeforeDeadline = (parameters.hoursBeforeDeadline as number) || 2;
    const allowEmergencyTransfers = (parameters.allowEmergencyTransfers as boolean) || false;

    const deadlineTime = new Date(context.gameweekData.end);
    const cutoffTime = new Date(deadlineTime.getTime() - hoursBeforeDeadline * 60 * 60 * 1000);
    const transferTime = context.transfer.timestamp;

    const isBeforeCutoff = transferTime <= cutoffTime;
    const isAfterDeadline = transferTime > deadlineTime;

    if (isAfterDeadline && !allowEmergencyTransfers) {
        return {
            ruleId: 'gameweek-deadline',
            ruleName: 'Gameweek Deadline',
            passed: false,
            severity: 'blocking',
            message: 'Transfer submitted after gameweek deadline',
            details: {
                transferTime: transferTime.toISOString(),
                deadline: deadlineTime.toISOString(),
                hoursLate:
                    Math.round(((transferTime.getTime() - deadlineTime.getTime()) / (1000 * 60 * 60)) * 100) / 100,
            },
        };
    }

    if (!isBeforeCutoff && !isAfterDeadline) {
        return {
            ruleId: 'gameweek-deadline',
            ruleName: 'Gameweek Deadline',
            passed: false,
            severity: 'warning',
            message: `Transfer submitted within ${hoursBeforeDeadline} hours of deadline`,
            details: {
                transferTime: transferTime.toISOString(),
                cutoffTime: cutoffTime.toISOString(),
                deadline: deadlineTime.toISOString(),
            },
        };
    }

    return {
        ruleId: 'gameweek-deadline',
        ruleName: 'Gameweek Deadline',
        passed: true,
        severity: 'blocking',
        message: 'Transfer submitted before deadline',
    };
}

/**
 * Validate minimum gap between transfers
 */
function validateMinimumGap(context: TransferRuleContext, parameters: Record<string, unknown>): RuleValidationResult {
    // This would need access to previous transfers for the manager
    // For now, return a placeholder implementation
    return {
        ruleId: 'minimum-gap-between-transfers',
        ruleName: 'Minimum Gap Between Transfers',
        passed: true,
        severity: 'warning',
        message: 'Gap validation requires transfer history (not implemented)',
    };
}

/**
 * Validate player availability
 */
function validatePlayerAvailability(
    context: TransferRuleContext,
    parameters: Record<string, unknown>,
): RuleValidationResult {
    const playerIn = context.transfer.playerIn;

    // Check if player is already owned by another manager
    for (const [managerId, roster] of Object.entries(context.divisionRosters)) {
        if (managerId === context.transfer.managerId) continue; // Skip current manager

        for (const positionSlot of Object.values(roster)) {
            if (positionSlot.player.playerCode === playerIn.code) {
                return {
                    ruleId: 'player-availability',
                    ruleName: 'Player Availability',
                    passed: false,
                    severity: 'blocking',
                    message: `Player ${playerIn.web_name} is already owned by another manager (${managerId})`,
                    details: {
                        currentOwner: managerId,
                    },
                };
            }
        }
    }

    return {
        ruleId: 'player-availability',
        ruleName: 'Player Availability',
        passed: true,
        severity: 'blocking',
        message: 'Player is available for transfer',
    };
}

/**
 * Validate injury status
 */
function validateInjuryStatus(context: TransferRuleContext, parameters: Record<string, unknown>): RuleValidationResult {
    const blockSuspended = (parameters.blockSuspended as boolean) ?? true;
    const blockInjured = (parameters.blockInjured as boolean) ?? false;
    const warnOnInjury = (parameters.warnOnInjury as boolean) ?? true;

    const player = context.fplPlayersByCode[context.transfer.playerIn.code];

    if (!player) {
        return {
            ruleId: 'injury-status',
            ruleName: 'Injury Status Check',
            passed: false,
            severity: 'advisory',
            message: 'Unable to check injury status - player not found',
        };
    }

    // Check suspension status (news contains suspension info)
    const isSuspended = player.news?.toLowerCase().includes('suspended') || false;
    if (isSuspended && blockSuspended) {
        return {
            ruleId: 'injury-status',
            ruleName: 'Injury Status Check',
            passed: false,
            severity: 'blocking',
            message: `Player ${player.web_name} is suspended`,
            details: {
                news: player.news,
            },
        };
    }

    // Check injury status
    const isInjured =
        player.news?.toLowerCase().includes('injur') || player.news?.toLowerCase().includes('doubt') || false;

    if (isInjured && blockInjured) {
        return {
            ruleId: 'injury-status',
            ruleName: 'Injury Status Check',
            passed: false,
            severity: 'blocking',
            message: `Player ${player.web_name} is injured`,
            details: {
                news: player.news,
            },
        };
    }

    if (isInjured && warnOnInjury) {
        return {
            ruleId: 'injury-status',
            ruleName: 'Injury Status Check',
            passed: false,
            severity: 'advisory',
            message: `Player ${player.web_name} may be injured`,
            details: {
                news: player.news,
            },
        };
    }

    return {
        ruleId: 'injury-status',
        ruleName: 'Injury Status Check',
        passed: true,
        severity: 'advisory',
        message: 'Player appears to be fit',
    };
}

/**
 * Validate position limits
 */
function validatePositionLimits(
    context: TransferRuleContext,
    parameters: Record<string, unknown>,
): RuleValidationResult {
    // This would need complex roster analysis
    // For now, return a basic implementation
    return {
        ruleId: 'position-limits',
        ruleName: 'Position Limits',
        passed: true,
        severity: 'blocking',
        message: 'Position limits validation requires roster analysis (not implemented)',
    };
}

/**
 * Validate squad size
 */
function validateSquadSize(context: TransferRuleContext, parameters: Record<string, unknown>): RuleValidationResult {
    const maxSquadSize = (parameters.maxSquadSize as number) || 12;
    const minSquadSize = (parameters.minSquadSize as number) || 11;

    const currentRoster = context.divisionRosters[context.transfer.managerId];
    if (!currentRoster) {
        return {
            ruleId: 'squad-size',
            ruleName: 'Squad Size Limits',
            passed: false,
            severity: 'blocking',
            message: 'Unable to find manager roster',
        };
    }

    const currentSquadSize = Object.keys(currentRoster).length;

    // For transfers, squad size shouldn't change
    if (context.transfer.transferType === 'TRANSFER') {
        return {
            ruleId: 'squad-size',
            ruleName: 'Squad Size Limits',
            passed: true,
            severity: 'blocking',
            message: 'Transfer maintains squad size',
            details: {
                currentSize: currentSquadSize,
            },
        };
    }

    // For new players, check if it would exceed max
    if (context.transfer.transferType === 'NEW_PLAYER') {
        const newSquadSize = currentSquadSize + 1;
        if (newSquadSize > maxSquadSize) {
            return {
                ruleId: 'squad-size',
                ruleName: 'Squad Size Limits',
                passed: false,
                severity: 'blocking',
                message: `Adding player would exceed maximum squad size (${newSquadSize}/${maxSquadSize})`,
                details: {
                    currentSize: currentSquadSize,
                    maxSize: maxSquadSize,
                },
            };
        }
    }

    return {
        ruleId: 'squad-size',
        ruleName: 'Squad Size Limits',
        passed: true,
        severity: 'blocking',
        message: 'Squad size within limits',
    };
}

/**
 * Validate gameweek transfer limit
 */
function validateGameweekTransferLimit(
    context: TransferRuleContext,
    parameters: Record<string, unknown>,
): RuleValidationResult {
    // This would need access to other transfers in the same gameweek
    // For now, return a placeholder
    return {
        ruleId: 'transfer-limit-per-gameweek',
        ruleName: 'Transfer Limit Per Gameweek',
        passed: true,
        severity: 'blocking',
        message: 'Transfer limit validation requires gameweek transfer history (not implemented)',
    };
}

/**
 * Validate position compatibility
 */
function validatePositionCompatibility(
    context: TransferRuleContext,
    parameters: Record<string, unknown>,
): RuleValidationResult {
    // This would need complex position matching logic
    // For now, return a basic implementation
    return {
        ruleId: 'position-compatibility',
        ruleName: 'Position Compatibility',
        passed: true,
        severity: 'blocking',
        message: 'Position compatibility validation requires position analysis (not implemented)',
    };
}

/**
 * Validate manager active status
 */
function validateManagerActiveStatus(
    context: TransferRuleContext,
    parameters: Record<string, unknown>,
): RuleValidationResult {
    // This would need manager status data
    // For now, assume all managers are active
    return {
        ruleId: 'manager-active-status',
        ruleName: 'Manager Active Status',
        passed: true,
        severity: 'blocking',
        message: 'Manager status validation requires manager data (assuming active)',
    };
}

/**
 * Validate league restrictions
 */
function validateLeagueRestrictions(
    context: TransferRuleContext,
    parameters: Record<string, unknown>,
): RuleValidationResult {
    const enableCustomRestrictions = (parameters.enableCustomRestrictions as boolean) || false;
    const restrictionMessage = (parameters.restrictionMessage as string) || 'Custom league restriction applies';

    if (!enableCustomRestrictions) {
        return {
            ruleId: 'league-specific-restrictions',
            ruleName: 'League Specific Restrictions',
            passed: true,
            severity: 'warning',
            message: 'No custom restrictions enabled',
        };
    }

    // Custom restriction logic would go here
    // For now, just return the configured message
    return {
        ruleId: 'league-specific-restrictions',
        ruleName: 'League Specific Restrictions',
        passed: false,
        severity: 'warning',
        message: restrictionMessage,
    };
}
