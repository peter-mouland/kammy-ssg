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

export interface SuggestionSource {
    /** What the source is, e.g. "Sofascore lineups" -- a bare URL says nothing at a glance. */
    label: string;
    url: string;
}

export interface PositionSuggestion {
    /** Null when no source was found. A blank cell beats a guess an admin approves by reflex. */
    position: PositionBucket | null;
    confidence: SuggestionConfidence;
    basis: SuggestionBasis;
    /** One line for the table row: the single fact that decides it, or why it could not be decided. */
    summary: string;
    /**
     * The argument, one point per entry, shown when the row is expanded. This is what an
     * admin needs to disagree with the call -- a position with no visible reasoning can
     * only be taken on trust, which is exactly what this page is meant to replace.
     */
    reasoning: string[];
    sources: SuggestionSource[];
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
