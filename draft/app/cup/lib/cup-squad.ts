/* Location: app/cup/lib/cup-squad.ts */

import type { CustomPosition } from '../../players/types/player-types';
import type { PositionSlotKey, TeamRoster } from '../../teams/types/team-types';

/** A player a manager can pick for their cup team, drawn from their squad. */
export interface CupSquadPlayer {
    code: number;
    name: string;
    position: CustomPosition;
    isSub: boolean;
    /** True when this player is only in the squad via an as-yet-unconfirmed (pending) sub. */
    isPending: boolean;
}

// Slots that hold a squad player. A player loaned OUT sits in `on_loan_0` and is
// not available to the lending manager, so it is intentionally excluded.
const SELECTABLE_SLOTS: PositionSlotKey[] = [
    'gk_0',
    'cb_0',
    'cb_1',
    'fb_0',
    'fb_1',
    'mid_0',
    'mid_1',
    'wa_0',
    'wa_1',
    'ca_0',
    'ca_1',
    'sub_0',
];

/**
 * Build the list of players a manager can pick from, based on their roster.
 * `pendingPlayerCodes` are players who are only present via a pending sub — they
 * are shown (so the manager sees their likely team) but flagged as pending so the
 * UI can signal that the pick may still change.
 */
export function getCupSquad(roster: TeamRoster, pendingPlayerCodes: Set<number> = new Set()): CupSquadPlayer[] {
    const squad: CupSquadPlayer[] = [];

    for (const slotKey of SELECTABLE_SLOTS) {
        const slot = roster[slotKey];
        if (!slot?.player) continue;

        // A player currently loaned out to another manager is not selectable.
        if (slot.player.onLoanTo) continue;

        squad.push({
            code: slot.player.playerCode,
            name: slot.player.playerName,
            position: slot.player.playerPosition,
            isSub: slot.player.isSub,
            isPending: pendingPlayerCodes.has(slot.player.playerCode),
        });
    }

    return squad;
}
