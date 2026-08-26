/* Location: app/admin/types/new-players-types.ts */

/**
 * The six buckets the league classifies every player into. Kept as a literal union
 * rather than derived from POSITION_COLUMNS because that constant is about *table
 * columns* -- it pairs gk with the sub slot -- and this is about a player's position.
 */
export const POSITION_BUCKETS = ['GK', 'CB', 'FB', 'MID', 'WA', 'CA'] as const;
export type PositionBucket = (typeof POSITION_BUCKETS)[number];

export function isPositionBucket(value: string): value is PositionBucket {
    return (POSITION_BUCKETS as readonly string[]).includes(value);
}

/** FPL's own element type, shown so an admin can see what the suggestion argued against. */
export type FplElementType = 'GKP' | 'DEF' | 'MID' | 'FWD';

/**
 * Whether the suggestion rests on where the player has actually been deployed, or on a
 * projection. A new signing with no Premier League minutes can only ever be a projection,
 * and those are the calls most likely to be wrong -- so the distinction is shown, not
 * flattened into the confidence level.
 */
export type SuggestionBasis = 'record' | 'projection';

export type SuggestionConfidence = 'high' | 'medium' | 'low';

export interface PositionSuggestion {
    /** Null when no source was found. A blank cell beats a guess an admin approves by reflex. */
    position: PositionBucket | null;
    confidence: SuggestionConfidence;
    basis: SuggestionBasis;
    sourceUrl: string | null;
    /** One line on what the call rests on, or why it could not be made. */
    note?: string;
}

/** In FPL, absent from the `Players` tab, so invisible everywhere on the site. */
export interface NewPlayerCandidate {
    code: number;
    webName: string;
    club: string;
    fplType: FplElementType;
    suggestion: PositionSuggestion | null;
}

/** In the `Players` tab with a position, but `isHidden` set -- not yet in the game. */
export interface HeldPlayer {
    code: number;
    webName: string;
    club: string;
    position: PositionBucket;
    addedAt: string;
}
