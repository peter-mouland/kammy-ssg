/* Location: app/scoring/lib/utils.ts */

import type { CustomPosition } from '../../_shared/types/league-types';
import { DRAFT_RULES } from '../../draft';

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
 * Format a points total for display.
 *
 * The negative branch used to build the string as `-${points}`, but `points` already
 * carries its own sign, so -3 rendered as "--3" in the Points column.
 *
 * NOTE: this used to be documented as adding a "+" prefix to positive totals. It never
 * did. Adding one now would change every points figure in the UI, so it is left alone
 * as a product decision rather than folded into a bug fix.
 */
export function formatPointsDisplay(points: number): string {
    return points.toString();
}
