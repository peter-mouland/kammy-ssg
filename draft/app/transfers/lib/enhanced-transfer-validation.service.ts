/* Location: app/transfers/lib/enhanced-transfer-validation.service.ts */
/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { PlayersByCode } from '../../scoring/types/scoring-types';
import type { DivisionId, ManagerId, TeamRoster } from '../../teams/types/team-types';
import type {
    RuleValidationResult,
    TransferRecommendation,
    TransferRule,
    TransferRuleContext,
    TransferValidationResult,
} from '../types/transfer-rule-types';
import type { ProcessedTransfer } from '../types/transfer-types';
import { type EnhancedRosterState, PendingTransferStateService } from './pending-transfer-state.service';
import { validateTransfer } from './transfer-validation.service';

/**
 * Enhanced validation result that includes virtual state information
 */
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
        appliedToVirtualState: boolean;
    }>;
    finalVirtualState: EnhancedRosterState;
    summary: {
        totalTransfers: number;
        approved: number;
        rejected: number;
        needsReview: number;
        virtualStateConflicts: number;
    };
}

/**
 * Enhanced transfer validation service that handles pending transfer conflicts
 */
export class EnhancedTransferValidationService {
    /**
     * Validate transfers sequentially, considering pending approved transfers
     */
    static async validateTransfersSequentially(
        transfers: ProcessedTransfer[],
        rules: TransferRule[],
        context: {
            divisionRosters: Record<ManagerId, TeamRoster>;
            gameweekData: GameWeekData;
            fplPlayersByCode: PlayersByCode;
            divisionId: DivisionId;
            currentGameweek: number;
        },
    ): Promise<SequentialValidationResult> {
        console.log(`🔄 Starting sequential validation of ${transfers.length} transfers`);

        // Sort transfers by timestamp to process in chronological order
        const sortedTransfers = [...transfers].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Initialize enhanced state with base rosters (no existing recommendations yet)
        const enhancedState = PendingTransferStateService.createEnhancedRosterState(
            context.divisionRosters,
            [],
            new Map(),
        );

        const transferValidations: SequentialValidationResult['transferValidations'] = [];
        const summary = {
            totalTransfers: transfers.length,
            approved: 0,
            rejected: 0,
            needsReview: 0,
            virtualStateConflicts: 0,
        };

        // Process each transfer in sequence
        for (const transfer of sortedTransfers) {
            console.log(
                `📋 Validating transfer ${transfer.id}: ${transfer.playerOut.web_name} → ${transfer.playerIn.web_name}`,
            );

            // Run standard validation first
            const standardValidation = await validateTransfer(transfer, rules, context);

            // Create enhanced validation result
            const enhancedValidation: EnhancedTransferValidationResult = {
                ...standardValidation,
            };

            // Check for virtual state conflicts
            const virtualResult = PendingTransferStateService.applyTransferToVirtualState(transfer, enhancedState);

            if (!virtualResult.success && virtualResult.conflict) {
                console.log(`❌ Virtual state conflict detected for transfer ${transfer.id}`);
                summary.virtualStateConflicts++;

                // Add virtual state conflict information
                enhancedValidation.virtualStateConflict = {
                    playerCode: virtualResult.conflict.playerCode,
                    playerName: virtualResult.conflict.playerName,
                    conflictingWith: virtualResult.conflict.currentOwner,
                    conflictingTransferId: virtualResult.conflict.conflictingTransfer.id,
                };

                // Override recommendation to REJECT due to virtual conflict
                enhancedValidation.recommendation = 'REJECT';
                enhancedValidation.isValid = false;

                // Add a blocking failure for the virtual conflict
                const virtualConflictRule: RuleValidationResult = {
                    ruleId: 'virtual-player-availability',
                    ruleName: 'Virtual Player Availability',
                    passed: false,
                    severity: 'blocking',
                    message: `Player ${virtualResult.conflict.playerName} is already being transferred to ${virtualResult.conflict.currentOwner} in a pending approved transfer`,
                    details: {
                        conflictingTransferId: virtualResult.conflict.conflictingTransfer.id,
                        conflictingManager: virtualResult.conflict.currentOwner,
                    },
                };

                enhancedValidation.ruleResults.push(virtualConflictRule);
                enhancedValidation.blockingFailures.push(virtualConflictRule);

                // Update summary
                enhancedValidation.summary = `Virtual conflict: Player already being transferred to ${virtualResult.conflict.currentOwner}. Original validation: ${standardValidation.summary}`;
            }

            // Determine if we should apply this transfer to virtual state
            const shouldApplyToVirtualState = enhancedValidation.recommendation === 'APPROVE' && virtualResult.success;

            // Apply to virtual state if approved and no conflicts
            if (shouldApplyToVirtualState) {
                enhancedState.virtualPlayerOwnership = virtualResult.updatedOwnership;
                enhancedState.pendingApprovedTransfers.push(transfer);
                console.log(`✅ Applied transfer ${transfer.id} to virtual state`);
            }

            // Update summary counts
            switch (enhancedValidation.recommendation) {
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
                validation: enhancedValidation,
                recommendation: enhancedValidation.recommendation,
                appliedToVirtualState: shouldApplyToVirtualState,
            });
        }

        console.log('✅ Sequential validation complete:', summary);

        // Log virtual state summary for debugging
        const virtualSummary = PendingTransferStateService.getVirtualOwnershipSummary(
            enhancedState.virtualPlayerOwnership,
        );
        console.log('📊 Final virtual state:', virtualSummary);

        return {
            transferValidations,
            finalVirtualState: enhancedState,
            summary,
        };
    }

    /**
     * Enhanced validation for a single transfer with virtual state context
     */
    static async validateTransferWithVirtualState(
        transfer: ProcessedTransfer,
        rules: TransferRule[],
        context: {
            divisionRosters: Record<ManagerId, TeamRoster>;
            gameweekData: GameWeekData;
            fplPlayersByCode: PlayersByCode;
            divisionId: DivisionId;
            currentGameweek: number;
        },
        virtualState: EnhancedRosterState,
    ): Promise<EnhancedTransferValidationResult> {
        console.log(`🔍 Validating transfer ${transfer.id} with virtual state context`);

        // Run standard validation
        const standardValidation = await validateTransfer(transfer, rules, context);

        // Create enhanced validation result
        const enhancedValidation: EnhancedTransferValidationResult = {
            ...standardValidation,
        };

        // Check for virtual state conflicts
        const virtualResult = PendingTransferStateService.applyTransferToVirtualState(transfer, virtualState);

        if (!virtualResult.success && virtualResult.conflict) {
            console.log(`❌ Virtual state conflict detected for transfer ${transfer.id}`);

            // Add virtual state conflict information
            enhancedValidation.virtualStateConflict = {
                playerCode: virtualResult.conflict.playerCode,
                playerName: virtualResult.conflict.playerName,
                conflictingWith: virtualResult.conflict.currentOwner,
                conflictingTransferId: virtualResult.conflict.conflictingTransfer.id,
            };

            // Override recommendation to REJECT due to virtual conflict
            enhancedValidation.recommendation = 'REJECT';
            enhancedValidation.isValid = false;

            // Add a blocking failure for the virtual conflict
            const virtualConflictRule: RuleValidationResult = {
                ruleId: 'virtual-player-availability',
                ruleName: 'Virtual Player Availability',
                passed: false,
                severity: 'blocking',
                message: `Player ${virtualResult.conflict.playerName} is already being transferred to ${virtualResult.conflict.currentOwner} in a pending approved transfer`,
                details: {
                    conflictingTransferId: virtualResult.conflict.conflictingTransfer.id,
                    conflictingManager: virtualResult.conflict.currentOwner,
                },
            };

            enhancedValidation.ruleResults.push(virtualConflictRule);
            enhancedValidation.blockingFailures.push(virtualConflictRule);

            // Update summary
            enhancedValidation.summary = `Virtual conflict: Player already being transferred to ${virtualResult.conflict.currentOwner}. ${standardValidation.summary}`;
        }

        return enhancedValidation;
    }

    /**
     * Build recommendations map from existing validation results
     */
    static buildRecommendationsMap(
        existingValidations: Array<{
            transfer: ProcessedTransfer;
            validation: TransferValidationResult;
            recommendation: TransferRecommendation;
        }>,
    ): Map<string, TransferRecommendation> {
        const recommendations = new Map<string, TransferRecommendation>();

        for (const item of existingValidations) {
            recommendations.set(item.transfer.id, item.recommendation);
        }

        console.log(`📋 Built recommendations map with ${recommendations.size} entries`);
        return recommendations;
    }
}
