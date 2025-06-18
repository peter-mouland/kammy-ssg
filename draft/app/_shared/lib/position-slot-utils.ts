// app/_shared/lib/position-slot-utils.ts
import type { PositionSlot, TeamPositionSlot } from '../types/division-teams-types';

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
    sub: { max: 1, displayName: 'Substitute' }
} as const;

/**
 * All possible position slots in order
 */
export const ALL_POSITION_SLOTS: PositionSlot[] = [
    'gk_0',
    'cb_0', 'cb_1',
    'fb_0', 'fb_1',
    'mid_0', 'mid_1',
    'wa_0', 'wa_1',
    'ca_0', 'ca_1',
    'sub_0'
];

/**
 * Starting XI position slots (excluding substitutes)
 */
export const STARTING_XI_SLOTS: PositionSlot[] = [
    'gk_0',
    'cb_0', 'cb_1',
    'fb_0', 'fb_1',
    'mid_0', 'mid_1',
    'wa_0', 'wa_1',
    'ca_0', 'ca_1'
];

/**
 * Substitute position slots
 */
export const SUBSTITUTE_SLOTS: PositionSlot[] = ['sub_0'];

/**
 * Parse position slot into its components
 */
export function parsePositionSlot(slot: PositionSlot): {
    position: string;
    index: number;
    isSub: boolean;
} {
    const [position, indexStr] = slot.split('_');
    return {
        position,
        index: parseInt(indexStr),
        isSub: position === 'sub'
    };
}

/**
 * Create position slot identifier
 */
export function createPositionSlot(
    position: 'gk' | 'cb' | 'fb' | 'mid' | 'wa' | 'ca' | 'sub',
    index: number
): PositionSlot {
    return `${position}_${index}` as PositionSlot;
}

/**
 * Get all position slots for a specific position
 */
export function getPositionSlots(position: 'gk' | 'cb' | 'fb' | 'mid' | 'wa' | 'ca' | 'sub'): PositionSlot[] {
    const config = POSITION_SLOT_CONFIG[position];
    return Array.from({ length: config.max }, (_, i) => createPositionSlot(position, i));
}

/**
 * Get display name for position slot
 */
export function getPositionSlotDisplayName(slot: PositionSlot): string {
    const { position, index, isSub } = parsePositionSlot(slot);
    const config = POSITION_SLOT_CONFIG[position as keyof typeof POSITION_SLOT_CONFIG];

    if (isSub) {
        return `Substitute ${index + 1}`;
    }

    if (config.max === 1) {
        return config.displayName;
    }

    return `${config.displayName} ${index + 1}`;
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
        substitutes: getPositionSlots('sub')
    };
}

/**
 * Check if a position slot is valid
 */
export function isValidPositionSlot(slot: string): slot is PositionSlot {
    return ALL_POSITION_SLOTS.includes(slot as PositionSlot);
}

/**
 * Get next available position slot for a player position
 */
export function getNextAvailableSlot(
    playerPosition: 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca',
    existingRoster: Record<string, TeamPositionSlot>
): PositionSlot | null {

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
 * Validate roster configuration
 */
export function validateRosterConfiguration(roster: Record<string, TeamPositionSlot>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required positions
    const requiredSlots = STARTING_XI_SLOTS;
    for (const slot of requiredSlots) {
        if (!roster[slot]) {
            errors.push(`Missing player in ${getPositionSlotDisplayName(slot)}`);
        }
    }

    // Check for duplicate players
    const playerCodes = new Set<number>();
    for (const [slot, positionSlot] of Object.entries(roster)) {
        if (playerCodes.has(positionSlot.player.playerCode)) {
            errors.push(`Duplicate player ${positionSlot.player.playerName} in multiple positions`);
        }
        playerCodes.add(positionSlot.player.playerCode);
    }

    // Check position assignments
    for (const [slot, positionSlot] of Object.entries(roster)) {
        const { position } = parsePositionSlot(slot as PositionSlot);
        const expectedTeamPosition = position === 'sub' ? 'sub' : position;

        if (positionSlot.player.teamPosition !== expectedTeamPosition) {
            warnings.push(`Player ${positionSlot.player.playerName} in ${slot} has mismatched team position`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Get roster summary statistics
 */
export function getRosterSummary(roster: Record<string, TeamPositionSlot>) {
    const summary = {
        totalPlayers: Object.keys(roster).length,
        startingXI: 0,
        substitutes: 0,
        loanedOut: 0,
        loanedIn: 0,
        positions: {} as Record<string, number>
    };

    for (const [slot, positionSlot] of Object.entries(roster)) {
        const { position, isSub } = parsePositionSlot(slot as PositionSlot);

        if (isSub) {
            summary.substitutes++;
        } else {
            summary.startingXI++;
        }

        if (positionSlot.player.onLoanTo) {
            summary.loanedOut++;
        }

        // Count by position
        summary.positions[position] = (summary.positions[position] || 0) + 1;
    }

    return summary;
}
