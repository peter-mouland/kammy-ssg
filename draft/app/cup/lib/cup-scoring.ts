/* Location: app/cup/lib/cup-scoring.ts */

/**
 * Cup scoring reuses the site's existing per-player league points (the
 * `player-gw-points` sheet, columns `gw-1`, `gw-2`, …). We never recompute
 * points here, so there is a single source of truth and no double counting.
 */

export interface PlayerPointsRow {
    playerCode: number;
    [key: string]: string | number;
}

function toNumber(value: string | number | undefined): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

/**
 * Build a code -> points map for a single gameweek. Double gameweeks store a
 * second value under `gw-N-b`, so both are summed.
 */
export function buildGameweekPointsMap(rows: PlayerPointsRow[], gameweek: number): Map<number, number> {
    const base = `gw-${gameweek}`;
    const second = `gw-${gameweek}-b`;
    const map = new Map<number, number>();
    for (const row of rows) {
        map.set(row.playerCode, toNumber(row[base]) + toNumber(row[second]));
    }
    return map;
}

/** Total points for a submission = sum of its players' league points that gameweek. */
export function scoreSubmission(players: number[], pointsByCode: Map<number, number>): number {
    return players.reduce((total, code) => total + (pointsByCode.get(code) ?? 0), 0);
}
