/* Location: app/transfers/lib/enhanced-player-availability-validator.ts */

import type { ManagerId } from '../../teams/types/team-types';
import type { RuleValidationResult, TransferRuleContext } from '../types/transfer-rule-types';
import { type EnhancedRosterState, PendingTransferStateService } from './pending-transfer-state.service';

/**
 * Enhanced player availability validator that considers virtual ownership from pending transfers
 * This can be used to replace the standard validatePlayerAvailability function when needed
 */
export function validateEnhancedPlayerAvailability(
    context: TransferRuleContext,
    parameters: Record<string, unknown>,
    virtualState?: EnhancedRosterState,
): RuleValidationResult {
    const playerIn = context.transfer.playerIn;

    // If no virtual state provided, fall back to standard validation
    if (!virtualState) {
        return validateStandardPlayerAvailability(context);
    }

    // Check availability in virtual state
    const availabilityResult = PendingTransferStateService.isPlayerAvailableInVirtualState(
        playerIn.code,
        context.transfer.managerId,
        virtualState.virtualPlayerOwnership,
    );

    if (!availabilityResult.available && availabilityResult.currentOwner) {
        // Find which pending transfer is causing the conflict
        const conflictingTransfer = virtualState.pendingApprovedTransfers.find(
            (pendingTransfer) =>
                pendingTransfer.playerIn.code === playerIn.code &&
                pendingTransfer.managerId === availabilityResult.currentOwner,
        );

        const conflictDetails = conflictingTransfer
            ? {
                  conflictingTransferId: conflictingTransfer.id,
                  conflictingTransferTime: conflictingTransfer.timestamp.toISOString(),
                  conflictingManager: conflictingTransfer.managerId,
              }
            : {
                  currentOwner: availabilityResult.currentOwner,
              };

        return {
            ruleId: 'player-availability',
            ruleName: 'Player Availability',
            passed: false,
            severity: 'blocking',
            message: conflictingTransfer
                ? `Player ${playerIn.web_name} is already being transferred to ${availabilityResult.currentOwner} in pending transfer ${conflictingTransfer.id}`
                : `Player ${playerIn.web_name} is already owned by another manager (${availabilityResult.currentOwner})`,
            details: conflictDetails,
        };
    }

    return {
        ruleId: 'player-availability',
        ruleName: 'Player Availability',
        passed: true,
        severity: 'blocking',
        message: 'Player is available for transfer',
        details: {
            checkedVirtualState: true,
            totalVirtualOwnerships: virtualState.virtualPlayerOwnership.size,
        },
    };
}

/**
 * Standard player availability validation (original logic)
 * Kept for backwards compatibility and fallback scenarios
 */
function validateStandardPlayerAvailability(context: TransferRuleContext): RuleValidationResult {
    const playerIn = context.transfer.playerIn;

    // Check if player is already owned by another manager in base rosters
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
                        checkedVirtualState: false,
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
        details: {
            checkedVirtualState: false,
        },
    };
}

/**
 * Factory function to create enhanced validation function with virtual state
 */
export function createEnhancedPlayerAvailabilityValidator(virtualState: EnhancedRosterState) {
    return (context: TransferRuleContext, parameters: Record<string, unknown>): RuleValidationResult => {
        return validateEnhancedPlayerAvailability(context, parameters, virtualState);
    };
}

/**
 * Utility function to check if a specific player would cause conflicts
 * Useful for pre-validation checks in the UI
 */
export function checkPlayerConflict(
    playerCode: number,
    targetManagerId: ManagerId,
    virtualState: EnhancedRosterState,
): {
    hasConflict: boolean;
    conflictingManager?: ManagerId;
    conflictingTransferId?: string;
    conflictingTransferTime?: Date;
} {
    const availabilityResult = PendingTransferStateService.isPlayerAvailableInVirtualState(
        playerCode,
        targetManagerId,
        virtualState.virtualPlayerOwnership,
    );

    if (!availabilityResult.available && availabilityResult.currentOwner) {
        const conflictingTransfer = virtualState.pendingApprovedTransfers.find(
            (pendingTransfer) =>
                pendingTransfer.playerIn.code === playerCode &&
                pendingTransfer.managerId === availabilityResult.currentOwner,
        );

        return {
            hasConflict: true,
            conflictingManager: availabilityResult.currentOwner,
            conflictingTransferId: conflictingTransfer?.id,
            conflictingTransferTime: conflictingTransfer?.timestamp,
        };
    }

    return { hasConflict: false };
}
