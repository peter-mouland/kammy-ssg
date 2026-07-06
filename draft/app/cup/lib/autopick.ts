/* Location: app/cup/lib/autopick.ts */

import type { CupSquadPlayer } from './cup-squad';

/**
 * Auto-select a manager's cup team when they miss a deadline: take the required
 * number of eligible players from their squad, excluding any already used in the
 * other leg of the round, chosen alphabetically for a deterministic result.
 * Returns fewer than required only if the squad can't supply enough.
 */
export function generateAutopick(
    squad: CupSquadPlayer[],
    playersRequired: number,
    usedPlayers: number[] = [],
): number[] {
    const used = new Set(usedPlayers);
    return squad
        .filter((player) => !used.has(player.code))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, playersRequired)
        .map((player) => player.code);
}
