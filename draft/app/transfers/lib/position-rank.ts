/* Location: app/transfers/lib/position-rank.ts */

import type { CustomPosition } from '../../_shared/types/league-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import { DRAFT_RULES, getPlayerPosition } from '../../draft';

/** Where a player's season points place them among everyone at their position. */
export interface PositionRank {
    /** 1 is the highest scorer. Players on equal points share a rank. */
    rank: number;
    /** How many players are ranked at this position. */
    of: number;
    position: CustomPosition;
    /** True when at least one other player at the position has the same points. */
    tied: boolean;
}

export type PositionRanksByCode = Record<EnhancedPlayerData['code'], PositionRank>;

const seasonPoints = (player: EnhancedPlayerData) => player.draft?.pointsTotal ?? 0;

/**
 * Each player's rank by season points within their own position, keyed by player code.
 *
 * The pool is the same one the player list offers: every player passed in, less the hidden
 * ones. So a rank always matches what a manager sees if they filter the list to the position
 * and sort by points. Ties use competition ranking -- 1, 2, 2, 4 -- so a rank never flatters
 * a player by more than the number of players actually ahead of them.
 */
export function buildPositionRanksByCode(players: EnhancedPlayerData[]): PositionRanksByCode {
    const byPosition = new Map<CustomPosition, EnhancedPlayerData[]>();
    for (const player of players) {
        const position = getPlayerPosition(player);
        if (player.draft?.isHidden || !position) {
            continue;
        }
        byPosition.set(position, [...(byPosition.get(position) ?? []), player]);
    }

    const ranks: PositionRanksByCode = {};
    for (const [position, group] of byPosition) {
        const sorted = [...group].sort((a, b) => seasonPoints(b) - seasonPoints(a));
        const playersOnPoints = countByPoints(sorted);
        sorted.forEach((player, index) => {
            const previous = sorted[index - 1];
            const rank =
                previous && seasonPoints(previous) === seasonPoints(player) ? ranks[previous.code].rank : index + 1;
            ranks[player.code] = {
                rank,
                of: sorted.length,
                position,
                tied: (playersOnPoints.get(seasonPoints(player)) ?? 0) > 1,
            };
        });
    }
    return ranks;
}

function countByPoints(players: EnhancedPlayerData[]): Map<number, number> {
    const counts = new Map<number, number>();
    for (const player of players) {
        counts.set(seasonPoints(player), (counts.get(seasonPoints(player)) ?? 0) + 1);
    }
    return counts;
}

function ordinal(n: number): string {
    const lastTwo = n % 100;
    if (lastTwo >= 11 && lastTwo <= 13) {
        return `${n}th`;
    }
    return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'}`;
}

/** The rank spelled out, for the tooltip: "3rd of 54 centre backs by season points". */
export function describePositionRank({ rank, of, position, tied }: PositionRank): string {
    const positionName = DRAFT_RULES.positions[position]?.name.toLowerCase() ?? position;
    return `${tied ? 'Joint ' : ''}${ordinal(rank)} of ${of} ${positionName}s by season points`;
}
