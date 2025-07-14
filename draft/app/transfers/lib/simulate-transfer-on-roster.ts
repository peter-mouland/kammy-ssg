import type { TeamRoster } from '../../teams/types/team-types';
import type { ProcessedTransfer } from '../types/transfer-types';
import { findPlayerInRoster } from './find-player-in-roster';

/**
 * Simulate how a transfer would affect a roster
 */
export function simulateTransferOnRoster(currentRoster: TeamRoster, transfer: ProcessedTransfer): TeamRoster {
    const simulatedRoster = JSON.parse(JSON.stringify(currentRoster)) as TeamRoster;

    if (!transfer.playerIn.draft) {
        console.error(' 🚨 : draft data doesnt exist, re-run points');
    }

    switch (transfer.transferType) {
        case 'NEW_PLAYER':
        case 'TRANSFER':
        case 'TRADE': {
            // Find the position slot containing the outgoing player
            const outgoingSlot = findPlayerInRoster(simulatedRoster, transfer.playerOut.code);
            if (outgoingSlot) {
                // Replace the outgoing player with the incoming player
                simulatedRoster[outgoingSlot.slotKey] = {
                    ...simulatedRoster[outgoingSlot.slotKey],
                    player: {
                        ...simulatedRoster[outgoingSlot.slotKey].player,
                        playerId: transfer.playerIn.code,
                        playerCode: transfer.playerIn.code,
                        playerName: transfer.playerIn.web_name,
                        playerPosition: transfer.playerIn.draft.position,
                    },
                };
            }
            break;
        }

        case 'SWAP':
            // For swaps, the overall position counts shouldn't change
            // This is an internal roster reorganization
            break;

        case 'LOAN_START':
        case 'LOAN_END':
            // Loans don't change position counts, just loan status
            break;
    }

    return simulatedRoster;
}
