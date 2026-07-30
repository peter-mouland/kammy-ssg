/**
 * Synthesizes the three defensive-action stats that FPL did not publish before 2025/26:
 * `clearances_blocks_interceptions`, `tackles`, `recoveries`.
 *
 * THIS DATA IS INVENTED. There is no real source for it, and that is not a gap in our capture —
 * FPL only added these fields for 2025/26, exposes them per-gameweek in `element-summary` and
 * never as an element-level season total, and the 2024/25 season is gone from the API. The
 * `FPL_Player_export` sheet has a `defensive_contribution` column but it is 0 for every player in
 * every position, and none of the 88 columns of the raw `Player Export` tab carry the components.
 *
 * So unlike the season totals elsewhere in these fixtures, there is no real aggregate being
 * preserved here. Values are plausible, not true.
 *
 * WHY SYNTHESIZE AT ALL
 *
 * `POSITION_RULES` awards defensive-contribution points — 1pt for fb/cb at 10+ CBIT, 2pts for mid
 * at 12+ CBIRT — and `calculations.ts` computes them from these three fields. With all three at
 * zero, no integration test can reach that rule and the player page's defensive columns are always
 * blank. Filling them makes the rule reachable.
 *
 * THE COST, STATED PLAINLY
 *
 * Every full-back, centre-back and midfielder now earns invented defensive points, so **harness
 * standings are not a faithful replay of the 2024/25 season.** Assert behaviour and shape against
 * these fixtures, never a specific total. `scoring/lib/calculations.test.ts` is what proves the
 * maths against known inputs.
 *
 * Deterministic: seeded by element id and gameweek, so regeneration is byte-stable.
 */

/**
 * Mean actions per 90 minutes by our custom position. Chosen so that threshold crossings land at
 * plausible rates rather than always or never — a centre-back clears the 10-CBIT bar in roughly
 * half of their full games, a midfielder the 12-CBIRT bar in rather fewer.
 */
const PER_90 = {
    gk: { cbi: 1.5, tackles: 0.2, recoveries: 1.5 },
    cb: { cbi: 8.0, tackles: 1.8, recoveries: 3.5 },
    fb: { cbi: 5.0, tackles: 2.6, recoveries: 4.0 },
    mid: { cbi: 3.0, tackles: 2.4, recoveries: 6.5 },
    wa: { cbi: 1.8, tackles: 1.6, recoveries: 4.0 },
    ca: { cbi: 1.2, tackles: 0.8, recoveries: 2.5 },
};

const DEFAULT_RATES = PER_90.mid;

/** Thresholds mirror POSITION_RULES; only fb, cb and mid have a defensive-contribution rule. */
const CBIT_POSITIONS = new Set(['cb', 'fb']);
const CBIT_THRESHOLD = 10;
const CBIRT_THRESHOLD = 12;
const FPL_DC_POINTS = 2;

/** Deterministic [0,1) from two integers. Cheap integer hash, no dependencies. */
function noise(a, b) {
    let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Scale a per-90 rate by minutes played, with ±50% deterministic variation. */
function actionCount(rate, minutes, elementId, round, salt) {
    if (minutes <= 0) return 0;
    const spread = 0.5 + noise(elementId * 31 + salt, round);
    return Math.round(rate * (minutes / 90) * spread);
}

/**
 * The three components plus FPL's own `defensive_contribution` aggregate, kept consistent with
 * them. The app ignores that aggregate for scoring — `calculations.ts` recomputes from the
 * components because FPL's version bakes in FPL's position — but it is displayed, so it should not
 * contradict the components sitting next to it.
 */
export function syntheticDefensiveStats({ elementId, round, minutes, position }) {
    const rates = PER_90[position] ?? DEFAULT_RATES;

    const clearancesBlocksInterceptions = actionCount(rates.cbi, minutes, elementId, round, 1);
    const tackles = actionCount(rates.tackles, minutes, elementId, round, 2);
    const recoveries = actionCount(rates.recoveries, minutes, elementId, round, 3);

    const cbit = clearancesBlocksInterceptions + tackles;
    const met = CBIT_POSITIONS.has(position)
        ? cbit >= CBIT_THRESHOLD
        : position !== 'gk' && cbit + recoveries >= CBIRT_THRESHOLD;

    return {
        clearances_blocks_interceptions: clearancesBlocksInterceptions,
        tackles,
        recoveries,
        defensive_contribution: met ? FPL_DC_POINTS : 0,
    };
}
