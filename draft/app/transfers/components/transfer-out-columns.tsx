/* Location: app/transfers/components/transfer-out-columns.tsx */

import type { TableColumn } from '../../_shared/components/table';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import { PointsBreakdownTooltip } from '../../scoring';
import { describePositionRank, type PositionRanksByCode } from '../lib/position-rank';
import type { UpcomingFixturesByTeamCode } from '../lib/upcoming-fixtures';
import { FixtureStrip } from './fixture-strip';
import styles from './transfer-out-columns.module.css';
import { playerColumn, pointsColumn } from './transfer-selector-stat-columns';

/**
 * Season points, and beneath them where those points rank at the player's position: 42
 * points means something different for a keeper than for a centre attacker. Just "#3": the
 * position badge beside the name already says which position, and the tooltip spells it out.
 * Builds on the shared points column, so the player list's Pts is untouched.
 */
function pointsWithRankColumn(positionRanksByCode: PositionRanksByCode): TableColumn<EnhancedPlayerData> {
    return {
        ...pointsColumn<EnhancedPlayerData>(),
        render: (_, player) => {
            const positionRank = positionRanksByCode[player.code];
            return (
                <div className={styles.points}>
                    <PointsBreakdownTooltip player={player}>{player.draft?.pointsTotal}</PointsBreakdownTooltip>
                    {positionRank && (
                        <span className={styles.positionRank} title={describePositionRank(positionRank)}>
                            #{positionRank.rank}
                        </span>
                    )}
                </div>
            );
        },
    };
}

/**
 * The columns for choosing who to move on from your own squad.
 *
 * Deliberately slimmer than the player list: who the player is, what they have scored and
 * how that ranks at their position, and what is coming up. The detailed stat columns stay on
 * the player list, where comparing candidates needs them. Player and Pts come from the same
 * factories, so the two never drift.
 */
export function getTransferOutColumns(
    teamsByCode: Record<number, FplTeam>,
    upcomingFixturesByTeamCode: UpcomingFixturesByTeamCode,
    positionRanksByCode: PositionRanksByCode = {},
): TableColumn<EnhancedPlayerData>[] {
    return [
        playerColumn(teamsByCode),
        pointsWithRankColumn(positionRanksByCode),
        {
            key: 'upcomingFixtures',
            header: <span title="Fixtures in the next three gameweeks">Next 3</span>,
            render: (_, player) => <FixtureStrip gameweeks={upcomingFixturesByTeamCode[player.team_code]} />,
        },
    ];
}
