/* Location: app/transfers/lib/position-compatibility-validator.ts */

import type { EnhancedPlayerData } from '../../../scoring/types/scoring-types';
import type { TeamRoster } from '../../../teams/types/team-types';
import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';
import { findPlayerInRoster } from '../find-player-in-roster';

// const description = 'Ensure transferred player fits the position slot';

/**
 * Validate position compatibility for transfers
 * Simple rule: gk -> gk, cb -> cb, fb -> fb, mid -> mid, wa -> wa, ca -> ca
 */
export function validatePositionCompatibility(context: TransferRuleContext): RuleValidationResult {
    const { transfer, divisionRosters } = context;

    if (!transfer.playerIn.draft) {
        console.error(' 🚨 : draft data doesnt exist, re-run points');
    }

    const playerIn = transfer.playerIn;
    const playerOut = transfer.playerOut;
    const playerInPosition = playerIn.draft.position;
    const managerTeam = divisionRosters[transfer.managerId];

    if (!playerInPosition) {
        return {
            ruleId: 'position-compatibility',
            ruleName: 'Position Compatibility',
            passed: false,
            severity: 'blocking',
            message: `Unable to determine position for player ${playerIn.web_name}`,
            details: {
                playerName: playerIn.web_name,
                playerCode: playerIn.code,
            },
        };
    }

    // Get manager's current roster
    if (!managerTeam) {
        return {
            ruleId: 'position-compatibility',
            ruleName: 'Position Compatibility',
            passed: false,
            severity: 'blocking',
            message: `Manager ${transfer.managerId} not found in division rosters`,
        };
    }

    const currentRoster = managerTeam.roster;

    // Validate based on transfer type
    switch (transfer.transferType) {
        case 'TRANSFER':
        case 'NEW_PLAYER':
        case 'TRADE':
            return validateReplacementCompatibility(currentRoster, playerOut, playerIn);

        case 'SWAP':
            return validateSwapReplacementCompatibility(currentRoster, playerOut, playerIn);

        default:
            return {
                ruleId: 'position-compatibility',
                ruleName: 'Position Compatibility',
                passed: true,
                severity: 'blocking',
                message: `Position validation not required for ${transfer.transferType}`,
                details: {
                    transferType: transfer.transferType,
                },
            };
    }
}

/**
 * Validate compatibility for TRANSFER/TRADE/New Player
 */
function validateReplacementCompatibility(
    roster: TeamRoster,
    playerOut: EnhancedPlayerData,
    playerIn: EnhancedPlayerData,
): RuleValidationResult {
    if (!playerIn?.draft) {
        console.error('playerIn should be EnhancedPlayerData');
        console.error(playerIn);
    }
    if (!playerOut?.draft) {
        console.error('playerOut should be EnhancedPlayerData');
        console.error(playerOut);
    }
    const playerInPosition = playerIn.draft.position;
    const playerOutPosition = playerOut.draft.position;
    const rosterOut = findPlayerInRoster(roster, playerOut.code);

    if (!rosterOut) {
        return {
            ruleId: 'position-compatibility',
            ruleName: 'Position Compatibility',
            passed: false,
            severity: 'blocking',
            message: `Outgoing player ${playerOut.web_name} (${playerOut.draft.position}) not found in roster`,
            details: {
                playerOutName: playerOut.web_name,
                playerOutCode: playerOut.code,
            },
        };
    }

    if (rosterOut.slot.player.isSub) {
        return {
            ruleId: 'position-compatibility',
            ruleName: 'Position Compatibility',
            passed: true,
            severity: 'blocking',
            message: `Player ${playerIn.web_name} can be placed on substitute bench`,
            details: {
                playerInPosition,
                targetPosition: 'sub',
                slotKey: rosterOut.slotKey,
            },
        };
    }

    const positionsMatch = playerInPosition === playerOutPosition;
    if (!positionsMatch) {
        return {
            ruleId: 'position-compatibility',
            ruleName: 'Position Compatibility',
            passed: false,
            severity: 'blocking',
            message: `Position mismatch: ${playerIn.web_name} (${playerInPosition}) cannot replace a ${playerOutPosition}.`,
            details: {
                playerInPosition,
                targetPosition: playerOutPosition,
                slotKey: rosterOut.slotKey,
                rule: `${playerOutPosition} slots require ${playerOutPosition} players`,
            },
        };
    }

    return {
        ruleId: 'position-compatibility',
        ruleName: 'Position Compatibility',
        passed: true,
        severity: 'blocking',
        message: `Position match: ${playerIn.web_name} (${playerInPosition}) can replace a ${playerOutPosition}.`,
        details: {
            playerInPosition,
            targetPosition: playerOutPosition,
            slotKey: rosterOut.slotKey,
        },
    };
}

/**
 * Validate compatibility for SWAP
 */
function validateSwapReplacementCompatibility(
    roster: TeamRoster,
    playerOut: EnhancedPlayerData,
    playerIn: EnhancedPlayerData,
): RuleValidationResult {
    const playerInPosition = playerIn.draft.position;
    const playerOutPosition = playerOut.draft.position;
    const rosterOut = findPlayerInRoster(roster, playerOut.code);
    const rosterIn = findPlayerInRoster(roster, playerIn.code);

    if (!rosterOut) {
        return {
            ruleId: 'position-compatibility',
            ruleName: 'Position Compatibility',
            passed: false,
            severity: 'blocking',
            message: `Outgoing player ${playerOut.web_name} not found in roster`,
            details: {
                playerOutName: playerOut.web_name,
                playerOutCode: playerOut.code,
            },
        };
    }
    if (!rosterIn) {
        return {
            ruleId: 'position-compatibility',
            ruleName: 'Position Compatibility',
            passed: false,
            severity: 'blocking',
            message: `Outgoing player ${playerIn.web_name} not found in roster`,
            details: {
                playerInName: playerIn.web_name,
                playerInCode: playerIn.code,
            },
        };
    }

    if (!rosterOut.slot.player.isSub && !rosterIn.slot.player.isSub) {
        return {
            ruleId: 'position-compatibility',
            ruleName: 'Position Compatibility',
            passed: false,
            severity: 'blocking',
            message: 'Swap must be involve a player on the substitute bench',
            details: {
                playerInPosition,
                targetPosition: playerOutPosition,
                slotKey: rosterOut.slotKey,
            },
        };
    }

    const positionsMatch = playerInPosition === playerOutPosition;
    if (!positionsMatch) {
        return {
            ruleId: 'position-compatibility',
            ruleName: 'Position Compatibility',
            passed: false,
            severity: 'blocking',
            message: `Position mismatch: ${playerIn.web_name} (${playerInPosition}) cannot replace ${playerOutPosition} position player. Only ${playerOutPosition} players can go into ${playerOutPosition} slots.`,
            details: {
                playerInPosition,
                targetPosition: playerOutPosition,
                slotKey: rosterOut.slotKey,
                rule: `${playerOutPosition} slots require ${playerOutPosition} players`,
            },
        };
    }

    return {
        ruleId: 'position-compatibility',
        ruleName: 'Position Compatibility',
        passed: true,
        severity: 'blocking',
        message: 'Internal swaps are always position compatible',
        details: {
            transferType: 'SWAP',
            playerInPosition,
        },
    };
}
