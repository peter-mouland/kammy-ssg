// app/_shared/types/performance-types.ts

/**
 * The data kernel, part one of three: what a player did, and what it scored.
 *
 * The data kernel is split three ways because they are three concepts, and collapsing
 * them hides that:
 *
 *   performance-types.ts  what happened in a match      <- you are here
 *   player-types.ts       who a player is
 *   squad-types.ts        where a player is
 *
 * This one is the base: the other two both depend on it, and it depends on neither.
 * A stat line and its points exist before anyone has been drafted anywhere.
 *
 * Named for performance rather than points because it holds both halves -- the raw stat
 * line (PlayerGameweekStatsData) is what a player *did*, and is not points.
 *
 * Why this is kernel and not scoring's: these are the units every domain passes around.
 * The rules that turn a stat line into points stay in scoring/lib -- that is scoring's
 * business logic and does not belong here. Only the shapes moved.
 *
 * Adding to this file needs a note in .kiro/backlog.md. It is a shared kernel, not a
 * second dumping ground.
 */

/** A player's raw stat line for a gameweek, or cumulative across a season. */
export interface PlayerGameweekStatsData {
    appearance: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    penaltiesSaved: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    bonus: number;
    defensiveContribution: number;
    // Raw components behind the defensive-contribution metric. We compute CBIT/CBIRT
    // ourselves (by custom position) rather than trusting FPL's aggregate, which is
    // baked to FPL's own position.
    clearancesBlocksInterceptions: number;
    tackles: number;
    recoveries: number;
}

/** Points awarded per category by POSITION_RULES. `total` is stored, not derived on read. */
export interface Points {
    appearance: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    penaltiesSaved: number;
    goalsConceded: number;
    bonus: number;
    defensiveContribution: number;
    total: number;
}

/** One line of the explanation behind a points figure, as the UI shows it. */
export interface PointsBreakdownItem {
    label: string;
    isRelevant?: boolean;
    points: number;
    stat: number;
    formula: string | string[];
}

export interface PointsBreakdown {
    appearance: PointsBreakdownItem;
    goals: PointsBreakdownItem;
    assists: PointsBreakdownItem;
    cleanSheets: PointsBreakdownItem;
    yellowCards: PointsBreakdownItem;
    redCards: PointsBreakdownItem;
    saves: PointsBreakdownItem;
    penaltiesSaved: PointsBreakdownItem;
    goalsConceded: PointsBreakdownItem;
    bonus: PointsBreakdownItem;
    defensiveContribution: PointsBreakdownItem;
    total: PointsBreakdownItem;
}
