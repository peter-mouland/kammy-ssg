// app/_shared/lib/position-slot-utils.ts

import type { CustomPosition } from '../../players/types/player-types';
import type { PositionSlotKey, RosterPosition, TeamRoster } from '../../teams/types/team-types';

/**
 * Position slot configuration
 */
export const POSITION_SLOT_CONFIG = {
    gk: { max: 1, displayName: 'Goalkeeper', scoresPoint: true },
    cb: { max: 2, displayName: 'Centre Back', scoresPoint: true },
    fb: { max: 2, displayName: 'Full Back', scoresPoint: true },
    mid: { max: 2, displayName: 'Midfielder', scoresPoint: true },
    wa: { max: 2, displayName: 'Wide Attacker', scoresPoint: true },
    ca: { max: 2, displayName: 'Centre Attacker', scoresPoint: true },
    sub: { max: 1, displayName: 'Substitute', scoresPoint: true },
    on_loan: { max: 1, displayName: 'On Loan', scoresPoint: false },
} as const;

/**
 * Parse position slot into its components
 */
export function parsePositionSlot(slot: PositionSlotKey): {
    position: CustomPosition | 'sub' | 'on_loan';
    index: number;
    isSub: boolean;
} {
    const [position, indexStr] = slot.split('_') as [CustomPosition | 'sub' | 'on_loan', string];
    return {
        position,
        index: Number.parseInt(indexStr),
        isSub: position === 'sub',
    };
}

/**
 * Create position slot identifier
 */
export function createPositionSlot(
    position: 'gk' | 'cb' | 'fb' | 'mid' | 'wa' | 'ca' | 'sub' | 'on_loan',
    index: number,
): PositionSlotKey {
    return `${position}_${index}` as PositionSlotKey;
}

/**
 * Get all position slots for a specific position
 */
export function getPositionSlots(
    position: 'gk' | 'cb' | 'fb' | 'mid' | 'wa' | 'ca' | 'sub' | 'on_loan',
): PositionSlotKey[] {
    const config = POSITION_SLOT_CONFIG[position];
    return Array.from({ length: config.max }, (_, i) => createPositionSlot(position, i));
}

/**
 * Get position slots organized by formation
 */
export function getFormationSlots() {
    return {
        goalkeeper: getPositionSlots('gk'),
        centrebacks: getPositionSlots('cb'),
        fullbacks: getPositionSlots('fb'),
        midfielders: getPositionSlots('mid'),
        wideAttackers: getPositionSlots('wa'),
        centralAttackers: getPositionSlots('ca'),
        substitutes: getPositionSlots('sub'),
        onLoan: getPositionSlots('on_loan'),
    };
}

/**
 * Get next available position slot for a player position
 */
export function getNextAvailableSlot(
    playerPosition: 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca',
    existingRoster: TeamRoster,
): PositionSlotKey | null {
    // Try to find available slot in target position
    const targetSlots = getPositionSlots(playerPosition);
    for (const slot of targetSlots) {
        if (!existingRoster[slot]) {
            return slot;
        }
    }

    // If no slots available in target position, try substitute
    const subSlots = getPositionSlots('sub');
    for (const slot of subSlots) {
        if (!existingRoster[slot]) {
            return slot;
        }
    }

    return null; // No available slots
}

/**
 * Check if a position slot should be included in scoring calculations
 * Excludes the on_loan_0 slot as loaned out players don't contribute to owning team's score
 */
export function isSlotScoringActive(slotKey: PositionSlotKey): boolean {
    return slotKey !== 'on_loan_0';
}

/**
 * Check if a roster position participates in scoring
 */
export function isPositionScoringActive(position: RosterPosition): boolean {
    return position !== 'on_loan';
}

/**
 * Get active scoring slots from a roster
 * Filters out on_loan_0 slot and any empty slots
 */
export function getActiveScoringSlots<T extends { player: { playerCode: number } }>(
    roster: Record<PositionSlotKey, T>,
): T[] {
    return Object.entries(roster)
        .filter(([slotKey, slot]) => isSlotScoringActive(slotKey as PositionSlotKey) && slot.player.playerCode > 0)
        .map(([, slot]) => slot);
}

export function getScoringSlots(roster: TeamRoster) {
    return Object.keys(roster)
        .filter((slotKey) => {
            const positionSlotKey = slotKey as PositionSlotKey;
            return POSITION_SLOT_CONFIG[parsePositionSlot(positionSlotKey).position]?.scoresPoint;
        })
        .map((slotKey) => {
            const positionSlotKey = slotKey as PositionSlotKey;
            return roster[positionSlotKey];
        });
}
