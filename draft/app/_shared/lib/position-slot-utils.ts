// app/_shared/lib/position-slot-utils.ts

import type { CustomPosition } from '../../players/types/player-types';
import type { PositionSlotKey, TeamPositionSlot, TeamRoster } from '../../teams/types/team-types';

/**
 * Position slot configuration
 */
export const POSITION_SLOT_CONFIG = {
    gk: { max: 1, displayName: 'Goalkeeper' },
    cb: { max: 2, displayName: 'Centre Back' },
    fb: { max: 2, displayName: 'Full Back' },
    mid: { max: 2, displayName: 'Midfielder' },
    wa: { max: 2, displayName: 'Wide Attacker' },
    ca: { max: 2, displayName: 'Centre Attacker' },
    sub: { max: 1, displayName: 'Substitute' },
    on_loan: { max: 1, displayName: 'On Loan' },
} as const;

/**
 * Starting XI position slots (excluding substitutes)
 */
export const STARTING_XI_SLOTS: PositionSlotKey[] = [
    'gk_0',
    'cb_0',
    'cb_1',
    'fb_0',
    'fb_1',
    'mid_0',
    'mid_1',
    'wa_0',
    'wa_1',
    'ca_0',
    'ca_1',
];

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
