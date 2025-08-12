// app/_shared/lib/position-order-utils.ts

import type { CustomPosition } from '../../players/types/player-types';
import type { ManagerId, RosterPlayer } from '../types/team-types';

/**
 * Position order configuration for sorting players by position
 * Order: GK, SUB, CB, FB, MID, WA, CA
 */
const POSITION_ORDER_MAP: Record<string, number> = {
    gk: 0,
    cb: 1,
    fb: 2,
    mid: 3,
    wa: 4,
    ca: 5,
    sub: 0.5,
} as const;

/**
 * Get the sort weight for a position
 * Lower numbers come first in sort order
 */
export function getPositionSortWeight(position: string): number {
    const normalizedPosition = position.toLowerCase();
    return POSITION_ORDER_MAP[normalizedPosition] ?? 999; // Unknown positions go to end
}

/**
 * Sort positions according to the defined order: GK, CB, FB, MID, WA, CA
 */
export function sortPositions(positions: string[]): string[] {
    return [...positions].sort((a, b) => {
        return getPositionSortWeight(a) - getPositionSortWeight(b);
    });
}

/**
 * Compare two players by position for sorting
 * Returns negative if a should come before b, positive if b should come before a
 */
export function comparePlayersByPosition(playerA: RosterPlayer, playerB: RosterPlayer): number {
    return getPositionSortWeight(playerA.teamPosition) - getPositionSortWeight(playerB.teamPosition);
}

/**
 * Get all positions in the correct display order
 */
export function getPositionsInOrder(): CustomPosition[] {
    return ['gk', 'cb', 'fb', 'mid', 'wa', 'ca'];
}

/**
 * Compare two team row data objects by manager name then position
 * This creates a compound sort: manager (alphabetical) then position (GK, CB, FB, MID, WA, CA)
 */
export function compareByManagerThenPosition<
    T extends {
        managerId: ManagerId;
        player: RosterPlayer;
    },
>(a: T, b: T): number {
    // First sort by manager ID alphabetically
    const managerComparison = a.managerId.localeCompare(b.managerId);

    // If managers are the same, sort by position
    if (managerComparison === 0) {
        return comparePlayersByPosition(a.player, b.player);
    }

    return managerComparison;
}
