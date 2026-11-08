/* Location: app/transfers/lib/group-roster-by-category.ts */

import type { PositionSlotKey } from '../../_shared/types/league-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { TeamRoster } from '../../_shared/types/squad-types';
import { type CategoryStanding, POSITION_COLUMNS } from '../../leagues';

export const ON_LOAN_GROUP_KEY = 'onLoan';

export interface RosterCategoryGroup {
    key: string;
    label: string;
    /** Absent for the on-loan group, or when the standings could not be loaded. */
    standing?: CategoryStanding;
    players: EnhancedPlayerData[];
}

/**
 * A manager's squad, grouped the way the league table scores it: GK / Sub, CB, FB, MID,
 * WA, CA, in table order, then anyone out on loan. Players within a group keep slot order.
 *
 * Players missing from `playersByCode` are dropped (they cannot be rendered or chosen),
 * and empty groups are left out.
 */
export function groupRosterByCategory(
    roster: TeamRoster,
    playersByCode: Record<number, EnhancedPlayerData>,
    standings: CategoryStanding[],
): RosterCategoryGroup[] {
    const playersInSlots = (slots: PositionSlotKey[]) =>
        slots.flatMap((slotKey) => {
            const playerCode = roster[slotKey]?.player.playerCode;
            const player = playerCode === undefined ? undefined : playersByCode[playerCode];
            return player ? [player] : [];
        });

    const categorySlots = new Set<string>(POSITION_COLUMNS.flatMap((column) => column.slots));
    const otherSlots = (Object.keys(roster) as PositionSlotKey[]).filter((slot) => !categorySlots.has(slot));

    const groups: RosterCategoryGroup[] = [
        ...POSITION_COLUMNS.map((column) => ({
            key: column.key,
            label: column.label,
            standing: standings.find((standing) => standing.position === column.key),
            players: playersInSlots(column.slots),
        })),
        { key: ON_LOAN_GROUP_KEY, label: 'On loan', players: playersInSlots(otherSlots) },
    ];

    return groups.filter((group) => group.players.length > 0);
}
