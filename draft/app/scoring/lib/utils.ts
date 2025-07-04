/* Location: app/scoring/lib/utils.ts */

import { DRAFT_RULES } from '../../draft/lib/draft-rules';
import type { CustomPosition } from '../../players/types/player-types';
import type { PositionSlotKey, RosterPosition } from '../../teams/types/team-types';

/**
 * Get the latest gameweek points for a player
 */
export function getLatestGameweekPoints(gameweekPoints: Record<number, any>): { gameweek: number; points: any } | null {
    const gameweeks = Object.keys(gameweekPoints)
        .map(Number)
        .sort((a, b) => b - a); // Sort descending to get latest first

    for (const gameweek of gameweeks) {
        const gwData = gameweekPoints[gameweek];
        if (gwData && !gwData.metadata?.noData) {
            return { gameweek, points: gwData.points };
        }
    }

    return null;
}

/**
 * Check if a player has data for a specific gameweek
 */
export function hasGameweekData(gameweekPoints: Record<number, any>, gameweek: number): boolean {
    const gwData = gameweekPoints[gameweek];
    return gwData && !gwData.metadata?.noData;
}

/**
 * Get available gameweeks for a set of players
 */
export function getAvailableGameweeks(fplPlayerGameweeksById: Record<number, any>): number[] {
    const gameweekSet = new Set<number>();

    Object.values(fplPlayerGameweeksById).forEach((playerData: any) => {
        if (playerData?.history) {
            playerData.history.forEach((gw: any) => {
                gameweekSet.add(gw.round);
            });
        }
    });

    return Array.from(gameweekSet).sort((a, b) => a - b);
}

/**
 * Get the latest gameweek with data
 */
export function getLatestGameweekWithData(fplPlayerGameweeksById: Record<number, any>): number | null {
    const gameweeks = getAvailableGameweeks(fplPlayerGameweeksById);
    return gameweeks.length > 0 ? Math.max(...gameweeks) : null;
}

/**
 * Check if gameweek has completed data
 * (useful for determining if a gameweek is "final" or still "live")
 */
export function isGameweekComplete(
    gameweek: number,
    fplPlayerGameweeksById: Record<number, any>,
    minimumPlayersWithData: number = 10,
): boolean {
    let playersWithData = 0;

    Object.values(fplPlayerGameweeksById).forEach((playerData: any) => {
        if (playerData?.history) {
            const hasGameweekData = playerData.history.some((gw: any) => gw.round === gameweek && gw.minutes > 0);
            if (hasGameweekData) {
                playersWithData++;
            }
        }
    });

    return playersWithData >= minimumPlayersWithData;
}

// Helper function to determine if a stat is relevant for a position
export const isStatRelevant = (stat: string, position: string): boolean => {
    switch (stat) {
        case 'clean_sheets':
            return ['gk', 'cb', 'fb', 'mid'].includes(position.toLowerCase());
        case 'goals_conceded':
            return ['gk', 'cb', 'fb'].includes(position.toLowerCase());
        case 'penalties_saved':
            return position.toLowerCase() === 'gk';
        case 'saves':
            return position.toLowerCase() === 'gk';
        case 'bonus':
            return ['cb', 'mid'].includes(position.toLowerCase());
        default:
            return true; // Goals, assists, minutes, cards are relevant for all
    }
};

/**
 * Get position display name from custom position enum
 */
export function getPositionDisplayName(position: CustomPosition): string | CustomPosition {
    const displayNames = {
        gk: DRAFT_RULES.positions.gk.name,
        fb: DRAFT_RULES.positions.fb.name,
        cb: DRAFT_RULES.positions.cb.name,
        mid: DRAFT_RULES.positions.mid.name,
        wa: DRAFT_RULES.positions.wa.name,
        ca: DRAFT_RULES.positions.ca.name,
    };

    return displayNames[position?.toLowerCase() as CustomPosition] || position;
}

/**
 * Get position color for UI display
 */
export function getPositionColor(position: CustomPosition): string {
    const colors = {
        gk: '#10B981', // emerald-500
        fb: '#3B82F6', // blue-500
        cb: '#3B82F6', // blue-500
        mid: '#8B5CF6', // violet-500
        wa: '#F59E0B', // amber-500
        ca: '#EF4444', // red-500
    };

    return colors[position];
}

/**
 * Format points for display (with + prefix for positive points)
 */
export function formatPointsDisplay(points: number): string {
    if (points > 0) return `+${points}`;
    return points.toString();
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
