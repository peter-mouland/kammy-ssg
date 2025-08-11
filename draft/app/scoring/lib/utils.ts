/* Location: app/scoring/lib/utils.ts */

import { DRAFT_RULES } from '../../draft/lib/draft-rules';
import type { CustomPosition } from '../../players/types/player-types';

// Helper function to determine if a stat is relevant for a position
export const isStatRelevant = (stat: string, position: string): boolean => {
    switch (stat) {
        case 'cleanSheets':
            return ['gk', 'cb', 'fb', 'mid'].includes(position.toLowerCase());
        case 'goalsConceded':
            return ['gk', 'cb', 'fb'].includes(position.toLowerCase());
        case 'penaltiesSaved':
            return position.toLowerCase() === 'gk';
        case 'saves':
            return position.toLowerCase() === 'gk';
        case 'bonus':
            return ['cb', 'mid'].includes(position.toLowerCase());
        case 'defensiveContribution':
            return ['fb', 'cb', 'mid'].includes(position.toLowerCase());
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
        gk: '#10B981',
        cb: '#10a0B6',
        fb: '#3B6fFF',
        mid: '#8B5CF6',
        wa: '#F59E0B',
        ca: '#EF4444',
    };

    return colors[position.toLowerCase() as CustomPosition];
}

/**
 * Format points for display (with + prefix for positive points)
 */
export function formatPointsDisplay(points: number): string {
    if (points > 0) return `+${points}`;
    return points.toString();
}
