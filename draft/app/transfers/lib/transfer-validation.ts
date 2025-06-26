/* Location: app/transfers/lib/transfer-validation.ts */

import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { TransferFormData, TransferValidationResult } from '../types/transfer-form-types';

/**
 * Validate a transfer request using existing transfer rules
 */
export async function validateTransfer(
    transferData: TransferFormData,
    playerOut: EnhancedPlayerData,
    playerIn: EnhancedPlayerData,
): Promise<TransferValidationResult> {
    try {
        console.log(`🔍 Validating transfer: ${playerOut.web_name} → ${playerIn.web_name}`);

        const warnings: string[] = [];
        const errors: string[] = [];
        const blockingIssues: string[] = [];

        // Basic validation
        await validateBasicRequirements(transferData, playerOut, playerIn, blockingIssues);

        // Position compatibility
        await validatePositionCompatibility(transferData, playerOut, playerIn, blockingIssues);

        // Player availability
        await validatePlayerAvailability(transferData, playerIn, blockingIssues);

        // Budget/cost constraints
        await validateBudgetConstraints(transferData, playerOut, playerIn, warnings);

        // Team limits
        await validateTeamLimits(transferData, playerOut, playerIn, warnings);

        // Transfer window timing
        await validateTransferTiming(transferData, warnings);

        // Use existing transfer rule validation system
        try {
            const { validateTransferRules } = await import('../server/services/transfer-rules-validation.service');
            const ruleValidation = await validateTransferRules(transferData, playerOut, playerIn);

            warnings.push(...ruleValidation.warnings);
            errors.push(...ruleValidation.errors);
            blockingIssues.push(...ruleValidation.blockingIssues);
        } catch (error) {
            console.warn('⚠️ Could not run full rule validation:', error);
            // Continue with basic validation
        }

        const isValid = blockingIssues.length === 0;

        console.log(`${isValid ? '✅' : '❌'} Transfer validation complete: ${isValid ? 'VALID' : 'INVALID'}`);
        if (blockingIssues.length > 0) {
            console.log('🚫 Blocking issues:', blockingIssues);
        }

        return {
            isValid,
            warnings,
            errors,
            blockingIssues,
        };
    } catch (error) {
        console.error('❌ Transfer validation failed:', error);
        return {
            isValid: false,
            warnings: [],
            errors: ['Validation system error'],
            blockingIssues: ['Unable to validate transfer - please try again'],
        };
    }
}

/**
 * Validate basic transfer requirements
 */
async function validateBasicRequirements(
    transferData: TransferFormData,
    playerOut: EnhancedPlayerData,
    playerIn: EnhancedPlayerData,
    blockingIssues: string[],
): Promise<void> {
    // Check if players are different
    if (playerOut.code === playerIn.code) {
        blockingIssues.push('Cannot transfer a player for themselves');
    }

    // Check if transfer type is valid for the operation
    if (transferData.transferType === 'SWAP' || transferData.transferType === 'TRADE') {
        // These require additional logic for multi-manager coordination
        blockingIssues.push('Swaps and trades are not yet supported in this interface');
    }
}

/**
 * Validate position compatibility
 */
async function validatePositionCompatibility(
    transferData: TransferFormData,
    playerOut: EnhancedPlayerData,
    playerIn: EnhancedPlayerData,
    blockingIssues: string[],
): Promise<void> {
    const playerOutPosition = playerOut.draft?.position;
    const playerInPosition = playerIn.draft?.position;

    if (!playerOutPosition || !playerInPosition) {
        blockingIssues.push('Player position information is missing');
        return;
    }

    // For standard transfers, positions must match
    if (transferData.transferType === 'TRANSFER' || transferData.transferType === 'NEW_PLAYER') {
        if (playerOutPosition !== playerInPosition) {
            blockingIssues.push(
                `Position mismatch: ${playerOut.web_name} is ${playerOutPosition}, ${playerIn.web_name} is ${playerInPosition}`,
            );
        }
    }
}

/**
 * Validate player availability
 */
async function validatePlayerAvailability(
    transferData: TransferFormData,
    playerIn: EnhancedPlayerData,
    blockingIssues: string[],
): Promise<void> {
    // Check if player is already owned
    if (playerIn.draft?.isOwned) {
        blockingIssues.push(
            `${playerIn.web_name} is already owned by ${playerIn.draft.ownerName || 'another manager'}`,
        );
    }

    // Check if player is available for the division
    // TODO: Add division-specific availability checks
}

/**
 * Validate budget constraints
 */
async function validateBudgetConstraints(
    transferData: TransferFormData,
    playerOut: EnhancedPlayerData,
    playerIn: EnhancedPlayerData,
    warnings: string[],
): Promise<void> {
    const costDifference = playerIn.now_cost - playerOut.now_cost;
    const costIncrease = costDifference / 10; // Convert to millions

    if (costDifference > 0) {
        if (costIncrease > 2.0) {
            warnings.push(
                `Significant cost increase: +£${costIncrease.toFixed(1)}m (${playerOut.web_name}: £${(playerOut.now_cost / 10).toFixed(1)}m → ${playerIn.web_name}: £${(playerIn.now_cost / 10).toFixed(1)}m)`,
            );
        }
    }
}

/**
 * Validate team limits
 */
async function validateTeamLimits(
    transferData: TransferFormData,
    playerOut: EnhancedPlayerData,
    playerIn: EnhancedPlayerData,
    warnings: string[],
): Promise<void> {
    // Check if this would exceed team player limits (e.g., max 3 from same team)
    if (playerOut.team_code !== playerIn.team_code) {
        warnings.push(
            `Team change: ${playerOut.web_name} (Team ${playerOut.team_code}) → ${playerIn.web_name} (Team ${playerIn.team_code})`,
        );
    }

    // TODO: Add actual team limit validation by checking current roster
}

/**
 * Validate transfer timing
 */
async function validateTransferTiming(transferData: TransferFormData, warnings: string[]): Promise<void> {
    try {
        const { getCurrentGameweek, getGameWeekData } = await import('../../_shared/lib/fpl/fpl-service');
        const currentGameweek = await getCurrentGameweek();
        const gameweekData = await getGameWeekData(currentGameweek);

        const deadline = new Date(gameweekData.fplEvent.deadline_time);
        const now = new Date();

        if (now > deadline) {
            warnings.push('Transfer deadline has passed for this gameweek');
        } else {
            const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursUntilDeadline < 24) {
                warnings.push(`Transfer deadline is in ${hoursUntilDeadline.toFixed(1)} hours`);
            }
        }
    } catch (error) {
        console.warn('⚠️ Could not validate transfer timing:', error);
    }
}
