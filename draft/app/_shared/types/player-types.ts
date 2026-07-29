// app/_shared/types/player-types.ts

/**
 * The data kernel, part two of three: who a player is.
 *
 *   performance-types.ts  what happened in a match
 *   player-types.ts       who a player is              <- you are here
 *   squad-types.ts        where a player is
 *
 * A player as the app knows them: FPL identity plus the draft layer's own metadata.
 * This exists whether or not anyone has drafted them -- it is the league's record of a
 * real footballer, not a squad member. Where they sit in a squad is squad-types.ts.
 *
 * EnhancedPlayerData appears in 39 files across every domain. It lived in scoring/types
 * only because scoring was the first to need it, which meant _shared had to import a
 * feature domain to say what a player is.
 *
 * Not to be confused with players/types/player-types.ts, which stays in the players
 * domain and holds view-models for the player pages (PlayerDetailData, PlayerStatsData).
 * Same basename, different job: that one is how the player *pages* are rendered.
 *
 * Adding to this file needs a note in .kiro/backlog.md. It is a shared kernel, not a
 * second dumping ground.
 */

import type { CustomPosition } from './league-types';
import type { PointsBreakdown } from './performance-types';

/** FPL base data enriched with the draft layer's own metadata. */
export interface EnhancedPlayerData {
    // Base FPL player data
    id: number;
    code: number;
    first_name: string;
    second_name: string;
    web_name: string;
    team_code: number;

    // Enhanced draft data
    draft: {
        isHidden?: boolean; // Flag indicating if this is a hidden player
        isNew?: boolean; // Flag indicating if this is a new player available for request
        position: CustomPosition;
        pointsTotal: number;
        pointsBreakdown: PointsBreakdown;
        __generatedFor?: {
            gameweeks?: number[];
            generatedAt: string;
            type: 'selective' | 'full' | 'season';
        };
    };
}

export type PlayersByCode = Record<EnhancedPlayerData['code'], EnhancedPlayerData>;
