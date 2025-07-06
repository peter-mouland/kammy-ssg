/* Location: app/transfers/lib/transfer-processor.service.ts */

import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { CustomPosition, PlayerGameweekStatsData } from '../../players/types/player-types';
import type { Points } from '../../scoring/types/scoring-types';
import type { RosterByManagerId, TeamRoster } from '../../teams/types/team-types';
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
                console.log(
                    `✅ Applied ${result.positionSlot} ${result.playerBefore?.web_name}->${result.playerAfter.web_name}`,
                );
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
        case 'TRADE':
            return applyExternalTransfer(managerRoster, transfer);
        case 'SWAP':
            return applyInternalSwap(managerRoster, transfer);
        case 'LOAN_START':
            return applyLoanStart(managerRoster, transfer);
        case 'LOAN_END':
            return applyLoanFinish(managerRoster, transfer);
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
    managerRoster[outgoingSlot.slotKey] = movePlayer({ player: playerIn, slot: outgoingSlot.slot });

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
    managerRoster[incomingSlot.slotKey] = movePlayer({ player: playerOut, slot: incomingSlot.slot });
    managerRoster[outgoingSlot.slotKey] = movePlayer({ player: playerIn, slot: outgoingSlot.slot });

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
 * Apply loan start - moves player to on_loan_0 slot and adds incoming player to original slot
 */
function applyLoanStart(managerRoster: TeamRoster, transfer: ProcessedTransfer): TransferApplicationResult {
    console.log('🟢 start applyLoanStart');
    const { managerId, playerOut, playerIn } = transfer;

    // Find the player being loaned out in lending team
    const outgoingSlot = findPlayerInRoster(managerRoster, playerOut.code);
    if (!outgoingSlot) {
        throw new Error(`Player ${playerOut.web_name} (${playerOut.code}) not found in ${managerId}'s roster`);
    }

    // Move player to on_loan_0 slot, if we're loaning a player to someone
    if (transfer.onLoanTo) {
        // Check if on_loan_0 slot is already occupied
        if (managerRoster.on_loan_0 && managerRoster.on_loan_0.player.playerCode !== transfer.playerOut.code) {
            throw new Error(`Manager ${managerId} already has a player on loan`);
        }

        managerRoster.on_loan_0 = {
            player: {
                playerId: playerOut.id,
                playerCode: playerOut.code,
                playerName: playerOut.web_name,
                playerPosition: playerOut.draft.position.toLowerCase() as CustomPosition,
                teamPosition: 'on_loan',
                teamSlotIndex: 0,
                isSub: false,
                onLoanTo: transfer.onLoanTo,
                onLoanStart: new Date().toISOString(),
                onLoanFrom: null,
                assignedAt: new Date().toISOString(),
            },
            gameweek: {
                stats: createEmptyStats(),
                points: createEmptyPoints(),
            },
            season: {
                stats: createEmptyStats(),
                points: createEmptyPoints(),
            },
        };
    }
    const loanFromDetails = transfer.onLoanFrom
        ? {
              onLoanFrom: transfer.onLoanFrom,
              onLoanStart: transfer.timestamp.toISOString(),
          }
        : undefined;

    managerRoster[outgoingSlot.slotKey] = movePlayer({ player: playerIn, slot: outgoingSlot.slot }, loanFromDetails);

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
 * Apply loan finish - returns player from on_loan_0 to active roster
 */
function applyLoanFinish(managerRoster: TeamRoster, transfer: ProcessedTransfer): TransferApplicationResult {
    const { managerId, playerIn, playerOut } = transfer;
    const owningRoster = managerRoster;

    // Find the player in on_loan_0 slot
    const loanedPlayer = managerRoster.on_loan_0?.player;
    if (loanedPlayer?.playerCode !== playerIn.code) {
        throw new Error(`Player ${playerIn.web_name} (${playerIn.code}) not found in ${managerId}'s loan slot`);
    }

    const outgoingSlot = findPlayerInRoster(managerRoster, playerOut.code);
    if (!outgoingSlot) {
        throw new Error(`🚨 Player ${playerOut.web_name} (${playerOut.code}) not found in ${managerId}'s roster`);
    }

    // move loaned player back into position
    managerRoster[outgoingSlot.slotKey] = movePlayer({ player: playerIn, slot: outgoingSlot.slot });

    // if the loan to someone is ending, then remove player from loan slot
    if (transfer.onLoanTo) {
        owningRoster.on_loan_0 = null;
    }

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
 * Create empty stats structure
 */
function createEmptyStats(): PlayerGameweekStatsData {
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

function createEmptyPoints(): Points {
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

const movePlayer = ({ player, slot }, loanInfo = {}) => {
    return {
        player: {
            playerId: player.id,
            playerCode: player.code,
            playerName: player.web_name,
            playerPosition: player.draft.position.toLowerCase() as CustomPosition,
            teamPosition: slot.player.teamPosition,
            teamSlotIndex: slot.player.teamSlotIndex,
            isSub: slot.player.isSub,
            onLoanTo: loanInfo.onLoanTo || null,
            onLoanStart: loanInfo.onLoanStart || null,
            onLoanFrom: loanInfo.onLoanFrom || null,
            assignedAt: new Date().toISOString(),
        },
        gameweek: {
            stats: createEmptyStats(),
            points: createEmptyPoints(),
        },
        season: slot.season, // keep slot season
    };
};
