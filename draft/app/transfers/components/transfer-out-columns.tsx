/* Location: app/transfers/components/transfer-out-columns.tsx */

import type { TableColumn } from '../../_shared/components/table';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { UpcomingFixturesByTeamCode } from '../lib/upcoming-fixtures';
import { FixtureStrip } from './fixture-strip';
import { playerColumn, pointsColumn } from './transfer-selector-stat-columns';

/**
 * The columns for choosing who to move on from your own squad.
 *
 * Deliberately slimmer than the player list: who the player is, what they have scored, and
 * what is coming up. The detailed stat columns stay on the player list, where comparing
 * candidates needs them. Player and Pts come from the same factories, so the two never drift.
 */
export function getTransferOutColumns(
    teamsByCode: Record<number, FplTeam>,
    upcomingFixturesByTeamCode: UpcomingFixturesByTeamCode,
): TableColumn<EnhancedPlayerData>[] {
    return [
        playerColumn(teamsByCode),
        pointsColumn(),
        {
            key: 'upcomingFixtures',
            header: <span title="Fixtures in the next three gameweeks">Next 3</span>,
            render: (_, player) => <FixtureStrip gameweeks={upcomingFixturesByTeamCode[player.team_code]} />,
        },
    ];
}
