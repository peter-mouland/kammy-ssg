import type { PositionSlotKey, TeamPositionSlot, TeamRoster } from '../../teams/types/team-types';


/**
 * Find a player in a roster by player code
 */
export function findPlayerInRoster(
    roster: TeamRoster,
    playerCode: number,
): { slotKey: PositionSlotKey; slot: TeamPositionSlot } | null {
    for (const [slotKey, positionSlot] of Object.entries(roster) as [PositionSlotKey, TeamPositionSlot][]) {
        if (positionSlot.player.playerCode === playerCode) {
            return {
                slotKey: slotKey,
                slot: positionSlot,
            };
        }
    }

    return null;
}
