/* Location: app/teams/components/team-of-the-week.tsx */

import { Link } from 'react-router';
import { PlayerSummaryPoints } from '../../_shared/components/player';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { TeamOfTheWeekData, TeamOfTheWeekPlayer } from '../../leagues';
import styles from './team-of-the-week.module.css';
import layoutStyles from './team-view.module.css';

/** Ownership is read from the viewed division, so this means "unowned in this division". */
const FREE_AGENT_LABEL = 'Free Agent';

type PlayerLookups = {
    teamsByCode: Record<number, FplTeam>;
    fplPlayersByCode: Record<number, EnhancedPlayerData>;
};

/**
 * One TOTW player, drawn with the same card as a My Team slot.
 *
 * TOTW players are picked from the FPL player list, so the lookup always finds them;
 * the TOTW position overrides the FPL one because it is the sheet position the points
 * were scored at.
 */
function TotwPlayerCard({ player, teamsByCode, fplPlayersByCode }: { player: TeamOfTheWeekPlayer } & PlayerLookups) {
    const fplPlayer = fplPlayersByCode[player.code];
    if (!fplPlayer) return null;

    return (
        <div className={styles.playerPosition}>
            <Link className={styles.playerCard} to={`/players/${player.code}`}>
                <PlayerSummaryPoints
                    player={{ ...fplPlayer, playerPosition: player.position }}
                    teamsByCode={teamsByCode}
                    points={player.points}
                />
                <span className={styles.owner}>{player.manager_name ?? FREE_AGENT_LABEL}</span>
            </Link>
        </div>
    );
}

function FormationRow({
    players,
    wide = false,
    ...lookups
}: { players: TeamOfTheWeekPlayer[]; wide?: boolean } & PlayerLookups) {
    if (players.length === 0) return null;

    return (
        <div className={`${styles.line} ${wide ? styles.wide : ''}`}>
            {players.map((player) => (
                <TotwPlayerCard key={player.code} player={player} {...lookups} />
            ))}
        </div>
    );
}

export function TeamOfTheWeek({ data, ...lookups }: { data: TeamOfTheWeekData } & PlayerLookups) {
    const { players } = data;

    return (
        <div className={layoutStyles.mainContent}>
            <div className={layoutStyles.pitchColumn}>
                <h3 className={styles.title}>Team of the Week — GW{data.gameweek}</h3>
                <div className={styles.pitch}>
                    <div className={styles.pitchBackground}>
                        <div className={styles.goal} />

                        <div className={styles.formation}>
                            <FormationRow players={players.ca} {...lookups} />
                            <FormationRow players={players.wa} wide {...lookups} />
                            <FormationRow players={players.mid} {...lookups} />
                            <FormationRow players={players.fb} wide {...lookups} />
                            <FormationRow players={players.cb} {...lookups} />
                            <FormationRow players={players.gk} {...lookups} />
                        </div>

                        <div className={styles.penaltyArea} />
                    </div>
                </div>
            </div>
        </div>
    );
}
