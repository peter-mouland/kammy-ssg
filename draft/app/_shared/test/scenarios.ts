/* Location: app/_shared/test/scenarios.ts */

/**
 * The dates a scenario is defined at, once, for every layer that needs one.
 *
 * Pure data. It imports nothing from a domain, because `_shared` may not
 * (architecture.test.ts, Rule 1), and because the loader tests, Storybook and the
 * Playwright crawl all read it — a scenario defined in three places drifts in two of them.
 *
 * **The dates are on 2024/25's calendar**, which is the season the FPL fixtures come from.
 * The league half of the fixtures is 2025/26; gameweek *numbers* line up between them and
 * dates only enter through deadlines, so GW21 here means the sheet's GW21 roster against
 * 2024/25's January deadline. A documented seam, invisible to the code.
 *
 * Three of these are counter-intuitive and were wrong in the plan before `gameweeks.test.ts`
 * pinned them:
 *
 * - **There is no "no gameweek yet" state at the start of a season.** GW1's window opens at
 *   a hardcoded floor (`2023-07-30T11:00:00.000Z` in `gameweeks.ts`), so *every* date before
 *   GW1's deadline reports GW1 as current. `preseason` is pre-deadline GW1 — nothing played,
 *   submission open — not an empty state.
 * - **2025-01-20 is GW23, not GW21.** GW21's deadline was the 14th and GW22's the 18th. To
 *   land in GW21 the date has to fall between GW20's deadline (2025-01-04T11:00Z) and GW21's
 *   (2025-01-14T18:00Z).
 * - **`season-end` has no current gameweek by date at all.** It reports 38 only because
 *   `getCurrentGameweekData()` falls through to FPL's frozen `is_current`, which happens to
 *   be GW38 in the captured bootstrap. The right answer by the wrong road: if that fallback
 *   is ever removed, this scenario silently becomes "no gameweek".
 */

export interface Scenario {
    /** Stable id. Used in committed payload filenames, so renaming one renames files. */
    name: string;
    /** The instant to run at, ISO. */
    now: string;
    /** The gameweek `getCurrentGameweekData()` reports here. Pinned by `gameweeks.test.ts`. */
    currentGameweek: number;
    /** What this date is for, in one clause. */
    exercises: string;
}

export const SCENARIOS = [
    {
        name: 'preseason',
        now: '2024-08-01T00:00:00.000Z',
        currentGameweek: 1,
        exercises: 'pre-deadline GW1 — nothing played, submission open',
    },
    {
        name: 'gw1-deadline-day',
        now: '2024-08-16T12:00:00.000Z',
        currentGameweek: 1,
        exercises: 'submission open with the deadline 5.5 hours away',
    },
    {
        name: 'gw1-locked',
        now: '2024-08-16T18:00:00.000Z',
        currentGameweek: 2,
        exercises: "just past GW1's deadline — teams revealed",
    },
    {
        name: 'cup-league',
        now: '2025-01-10T00:00:00.000Z',
        currentGameweek: 21,
        exercises: 'mid-season, cup league stage (CupConfig: league = 21,22,23)',
    },
    {
        name: 'cup-r16-leg1',
        now: '2025-01-29T00:00:00.000Z',
        currentGameweek: 24,
        exercises: 'a two-legged round (r16 = 24,25) and the player-reuse ban',
    },
    {
        name: 'season-end',
        now: '2025-05-26T00:00:00.000Z',
        currentGameweek: 38,
        exercises: 'past the final deadline — falls back to FPL’s frozen flag',
    },
] as const satisfies readonly Scenario[];

export type ScenarioName = (typeof SCENARIOS)[number]['name'];

export const scenario = (name: ScenarioName): Scenario => {
    const found = SCENARIOS.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`Unknown scenario: ${name}`);
    return found;
};
