/* Location: app/transfers/lib/transfer-processor.service.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { CustomPosition } from '../../players/types/player-types';
import type { RosterByManagerId, TeamPositionSlot, TeamRoster } from '../../teams/types/team-types';
import type { ProcessedTransfer, TransferApplicationResult } from '../types/transfer-types';
import { findPlayerInRoster } from './find-player-in-roster';

// Filter transfers for this gameweek period and sort by timestamp
export const getGameweekTransfers = (transfers: ProcessedTransfer[], gameweekData: GameWeekData) =>
    transfers
        .filter((transfer) => {
            return (
                new Date(transfer.timestamp) >= new Date(gameweekData.start) &&
                new Date(transfer.timestamp) <= new Date(gameweekData.end)
            );
        })
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

/**
 * Apply transfers to a division's team rosters for a specific gameweek period
 */
export async function applyTransfersToRosters(
    divisionRosters: RosterByManagerId,
    transfers: ProcessedTransfer[],
    gameweekData: GameWeekData,
): Promise<{
    updatedRosters: RosterByManagerId;
    appliedTransfers: TransferApplicationResult[];
    errors: string[];
}> {
    const relevantTransfers = getGameweekTransfers(transfers, gameweekData);
    console.log(`🔄 Applying ${relevantTransfers.length} transfers for gameweek ${gameweekData.fplEvent.id}`);

    const updatedRosters = JSON.parse(JSON.stringify(divisionRosters)) as RosterByManagerId;
    const appliedTransfers: TransferApplicationResult[] = [];
    const errors: string[] = [];

    console.log(`📋 Found ${relevantTransfers.length} transfers to apply`);

    for (const transfer of relevantTransfers) {
        try {
            const result = await applyIndividualTransfer(updatedRosters, transfer);
            if (result) {
                if (result.updatedRoster) {
                    updatedRosters[transfer.managerId].roster = result.updatedRoster;
                }
                appliedTransfers.push(result);
            }
        } catch (error) {
            const errorMsg = `Failed to apply transfer ${transfer.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`❌ ${errorMsg}`);
            errors.push(errorMsg);
        }
    }

    console.log(`✅ Applied ${appliedTransfers.length} transfers successfully`);
    if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} transfer application errors`);
    }

    return {
        updatedRosters,
        appliedTransfers,
        errors,
    };
}

/**
 * Apply a single transfer to the rosters
 */
async function applyIndividualTransfer(
    rosters: RosterByManagerId,
    transfer: ProcessedTransfer,
): Promise<TransferApplicationResult | null> {
    const { managerId, transferType } = transfer;
    const managerRoster = rosters[managerId].roster;
    // Ensure manager exists in rosters
    if (!rosters[managerId]) {
        throw new Error(`Manager ${managerId} not found in rosters`);
    }

    switch (transferType) {
        case 'NEW_PLAYER':
        case 'TRANSFER':
            return applyExternalTransfer(managerRoster, transfer);
        case 'SWAP':
            return applyInternalSwap(managerRoster, transfer);
        case 'LOAN_START':
            return applyLoanStart(managerRoster, transfer);
        case 'LOAN_FINISH':
            return applyLoanFinish(managerRoster, transfer);
        case 'TRADE':
            return applyTrade(managerRoster, transfer);
    }
}

/**
 * Apply external transfer (player in/out of team)
 */
function applyExternalTransfer(managerRoster: TeamRoster, transfer: ProcessedTransfer): TransferApplicationResult {
    console.log('🔄 applyExternalTransfer');
    const { managerId, playerOut, playerIn } = transfer;

    // Find the position slot containing the outgoing player
    const outgoingSlot = findPlayerInRoster(managerRoster, playerOut.code);
    if (!outgoingSlot) {
        throw new Error(`🚨 Player ${playerOut.web_name} (${playerOut.code}) not found in ${managerId}'s roster`);
    }

    // Create new position slot for incoming player
    const newPositionSlot: TeamPositionSlot = {
        player: {
            playerId: playerIn.id,
            playerCode: playerIn.code,
            playerName: playerIn.web_name,
            playerPosition: playerIn.draft.position.toLowerCase() as CustomPosition,
            teamPosition: outgoingSlot.slot.player.teamPosition,
            teamSlotIndex: outgoingSlot.slot.player.teamSlotIndex,
            isSub: outgoingSlot.slot.player.isSub,
            onLoanTo: null,
            onLoanStart: null,
            assignedAt: transfer.timestamp.toISOString(),
        },
        gameweek: {
            stats: createEmptyStats(),
            points: createEmptyPoints(),
        },
        season: managerRoster[outgoingSlot.slotKey].season, // keep slot season
    };

    // Update the roster
    managerRoster[outgoingSlot.slotKey] = newPositionSlot;

    return {
        rosterId: managerId,
        positionSlot: outgoingSlot.slotKey,
        playerBefore: playerOut,
        playerAfter: playerIn,
        transferId: transfer.id,
        appliedAt: new Date(),
        updatedRoster: managerRoster,
    };
}

/**
 * Apply internal swap (between positions in same team)
 */
function applyInternalSwap(managerRoster: TeamRoster, transfer: ProcessedTransfer): TransferApplicationResult {
    console.log('🔄 applyInternalSwap');
    const { managerId, playerOut, playerIn } = transfer;

    // Find both players in the roster
    const outgoingSlot = findPlayerInRoster(managerRoster, playerOut.code);
    const incomingSlot = findPlayerInRoster(managerRoster, playerIn.code);

    if (!outgoingSlot) {
        throw new Error(`🚨 Player ${playerOut.web_name} (${playerOut.code}) not found in ${managerId}'s roster`);
    }

    if (!incomingSlot) {
        throw new Error(`🚨 Player ${playerIn.web_name} (${playerIn.code}) not found in ${managerId}'s roster`);
    }

    // Swap the players between positions
    const tempPlayer = { ...managerRoster[outgoingSlot.slotKey] };
    managerRoster[outgoingSlot.slotKey] = { ...managerRoster[incomingSlot.slotKey] };
    managerRoster[incomingSlot.slotKey] = tempPlayer;

    // Update assignment timestamps
    managerRoster[outgoingSlot.slotKey].player.assignedAt = transfer.timestamp.toISOString();
    managerRoster[incomingSlot.slotKey].player.assignedAt = transfer.timestamp.toISOString();

    return {
        rosterId: managerId,
        positionSlot: outgoingSlot.slotKey,
        playerBefore: playerOut,
        playerAfter: playerIn,
        transferId: transfer.id,
        appliedAt: new Date(),
        updatedRoster: managerRoster,
    };
}

/**
 * Apply loan start
 */
function applyLoanStart(managerRoster: TeamRoster, transfer: ProcessedTransfer): TransferApplicationResult {
    const { managerId, playerOut } = transfer;

    // Find the player being loaned out
    const playerSlot = findPlayerInRoster(managerRoster, playerOut.code);
    if (!playerSlot) {
        throw new Error(`Player ${playerOut.web_name} (${playerOut.code}) not found in ${managerId}'s roster`);
    }

    // Update loan status
    managerRoster[playerSlot.slotKey].player.onLoanTo = transfer.playerIn.web_name; // Using webName as loan destination
    managerRoster[playerSlot.slotKey].player.onLoanStart = transfer.timestamp.toISOString();

    return {
        rosterId: managerId,
        positionSlot: playerSlot.slotKey,
        playerBefore: playerOut,
        playerAfter: transfer.playerIn,
        transferId: transfer.id,
        appliedAt: new Date(),
        updatedRoster: managerRoster,
    };
}

/**
 * Apply loan finish
 */
function applyLoanFinish(managerRoster: TeamRoster, transfer: ProcessedTransfer): TransferApplicationResult {
    const { managerId, playerIn } = transfer;

    // Find the player being returned from loan
    const playerSlot = findPlayerInRoster(managerRoster, playerIn.code);
    if (!playerSlot) {
        throw new Error(`Player ${playerIn.web_name} (${playerIn.code}) not found in ${managerId}'s roster`);
    }

    // Clear loan status
    managerRoster[playerSlot.slotKey].player.onLoanTo = null;
    managerRoster[playerSlot.slotKey].player.onLoanStart = null;

    return {
        rosterId: managerId,
        positionSlot: playerSlot.slotKey,
        playerBefore: transfer.playerOut,
        playerAfter: playerIn,
        transferId: transfer.id,
        appliedAt: new Date(),
        updatedRoster: managerRoster,
    };
}

/**
 * Apply trade (between different teams)
 */
function applyTrade(managerRoster: TeamRoster, transfer: ProcessedTransfer): TransferApplicationResult {
    // For now, treat trades like external transfers
    // Could be enhanced later to handle two-way trades
    return applyExternalTransfer(managerRoster, transfer);
}

/**
 * Create empty stats structure
 */
function createEmptyStats() {
    return {
        appearance: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        goalsConceded: 0,
        penaltiesSaved: 0,
        yellowCards: 0,
        redCards: 0,
        saves: 0,
        bonus: 0,
    };
}

/**
 * Create empty points structure
 */
function createEmptyPoints() {
    return {
        appearance: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        saves: 0,
        penaltiesSaved: 0,
        goalsConceded: 0,
        bonus: 0,
        total: 0,
    };
}
