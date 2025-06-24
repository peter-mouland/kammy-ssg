/* Location: app/transfers/lib/pending-transfer-state.service.ts */
/** biome-ignore-all lint/complexity/noStaticOnlyClass: <?> */

import type { FplPlayerData } from '../../_shared/lib/fpl/fpl-types';
import type { ManagerId, RosterByManagerId } from '../../teams/types/team-types';
import type { TransferRecommendation } from '../types/transfer-rule-types';
import type { ProcessedTransfer } from '../types/transfer-types';

/**
 * Enhanced roster state that includes pending approved transfers
 */
export interface EnhancedRosterState {
    baseRosters: RosterByManagerId;
    pendingApprovedTransfers: ProcessedTransfer[];
    virtualPlayerOwnership: Map<number, ManagerId>; // playerCode -> managerId
}

/**
 * Result of applying a pending transfer to virtual state
 */
export interface VirtualTransferResult {
    success: boolean;
    conflict?: {
        playerCode: FplPlayerData['code'];
        playerName: string;
        currentOwner: ManagerId;
        conflictingTransfer: ProcessedTransfer;
    };
    updatedOwnership: Map<FplPlayerData['code'], ManagerId>;
}

/**
 * Service for managing pending transfer state and virtual ownership
 */
export class PendingTransferStateService {
    /**
     * Create enhanced roster state that includes virtual ownership from pending approved transfers
     */
    static createEnhancedRosterState(
        baseRosters: RosterByManagerId,
        allPendingTransfers: ProcessedTransfer[],
        existingRecommendations: Map<string, TransferRecommendation>,
    ): EnhancedRosterState {
        console.log(`📊 Creating enhanced roster state with ${allPendingTransfers.length} pending transfers`);

        // Filter to only pending transfers that have been recommended for approval
        const pendingApprovedTransfers = allPendingTransfers.filter((transfer) => {
            const recommendation = existingRecommendations.get(transfer.id);
            return transfer.status === 'PENDING' && recommendation === 'APPROVE';
        });

        console.log(`✅ Found ${pendingApprovedTransfers.length} pending transfers recommended for approval`);

        // Build initial virtual ownership from base rosters
        const virtualPlayerOwnership = new Map<FplPlayerData['code'], ManagerId>();

        for (const [managerId, roster] of Object.entries(baseRosters)) {
            for (const positionSlot of Object.values(roster.roster)) {
                if (positionSlot.player.playerCode) {
                    virtualPlayerOwnership.set(positionSlot.player.playerCode, managerId);
                }
            }
        }

        console.log(`📋 Base rosters contain ${virtualPlayerOwnership.size} player ownerships`);

        return {
            baseRosters,
            pendingApprovedTransfers,
            virtualPlayerOwnership,
        };
    }

    /**
     * Validate and apply a transfer to the virtual state
     * Returns success/failure and any conflicts
     */
    static applyTransferToVirtualState(
        transfer: ProcessedTransfer,
        enhancedState: EnhancedRosterState,
    ): VirtualTransferResult {
        const newOwnership = new Map(enhancedState.virtualPlayerOwnership);
        const playerInCode = transfer.playerIn.code;

        // Check if the player is already owned in virtual state
        const currentVirtualOwner = newOwnership.get(playerInCode);

        if (currentVirtualOwner && currentVirtualOwner !== transfer.managerId) {
            // Find which pending transfer caused this conflict
            const conflictingTransfer = enhancedState.pendingApprovedTransfers.find(
                (pendingTransfer) =>
                    pendingTransfer.playerIn.code === playerInCode && pendingTransfer.managerId === currentVirtualOwner,
            );

            return {
                success: false,
                conflict: {
                    playerCode: playerInCode,
                    playerName: transfer.playerIn.web_name,
                    currentOwner: currentVirtualOwner,
                    conflictingTransfer: conflictingTransfer || transfer, // Fallback to current transfer
                },
                updatedOwnership: enhancedState.virtualPlayerOwnership, // Return unchanged
            };
        }

        // Apply the transfer to virtual state
        switch (transfer.transferType) {
            case 'TRANSFER':
            case 'NEW_PLAYER':
            case 'TRADE': {
                // Remove old player if this is a transfer (not new player)
                // if (transfer.transferType === 'TRANSFER' || transfer.transferType === 'TRADE') {
                const playerOutCode = transfer.playerOut.code;
                newOwnership.delete(playerOutCode);
                // }

                // Add new player
                newOwnership.set(playerInCode, transfer.managerId);
                break;
            }
            case 'SWAP':
                // For swaps, both players should already be owned by the same manager
                // This is an internal position change, no ownership change needed
                break;

            case 'LOAN_START':
            case 'LOAN_FINISH':
                // Loans don't change ownership, just loan status
                // No changes to virtual ownership needed
                break;
        }

        return {
            success: true,
            updatedOwnership: newOwnership,
        };
    }

    /**
     * Check if a player is available considering virtual ownership
     */
    static isPlayerAvailableInVirtualState(
        playerCode: number,
        targetManagerId: ManagerId,
        virtualOwnership: Map<number, ManagerId>,
    ): { available: boolean; currentOwner?: ManagerId } {
        const currentOwner = virtualOwnership.get(playerCode);

        if (!currentOwner) {
            // Player is not owned by anyone
            return { available: true };
        }

        if (currentOwner === targetManagerId) {
            // Player is already owned by the target manager
            return { available: true, currentOwner };
        }

        // Player is owned by someone else
        return { available: false, currentOwner };
    }

    /**
     * Get all players owned by a manager in virtual state
     */
    static getManagerPlayersInVirtualState(managerId: ManagerId, virtualOwnership: Map<number, ManagerId>): number[] {
        const playerCodes: number[] = [];

        for (const [playerCode, ownerId] of virtualOwnership.entries()) {
            if (ownerId === managerId) {
                playerCodes.push(playerCode);
            }
        }

        return playerCodes;
    }

    /**
     * Get virtual ownership summary for debugging
     */
    static getVirtualOwnershipSummary(virtualOwnership: Map<number, ManagerId>): {
        totalPlayers: number;
        playersByManager: Record<ManagerId, number>;
        sampleOwnerships: Array<{ playerCode: number; managerId: ManagerId }>;
    } {
        const playersByManager: Record<ManagerId, number> = {};
        const sampleOwnerships: Array<{ playerCode: number; managerId: ManagerId }> = [];

        let count = 0;
        for (const [playerCode, managerId] of virtualOwnership.entries()) {
            playersByManager[managerId] = (playersByManager[managerId] || 0) + 1;

            // Collect first 5 ownerships as samples
            if (count < 5) {
                sampleOwnerships.push({ playerCode, managerId });
                count++;
            }
        }

        return {
            totalPlayers: virtualOwnership.size,
            playersByManager,
            sampleOwnerships,
        };
    }
}
