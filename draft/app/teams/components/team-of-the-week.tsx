/* Location: app/leagues/components/team-of-the-week.tsx */

import { Link } from 'react-router';
import type { TeamOfTheWeekData, TeamOfTheWeekPlayer } from '../../leagues';
import styles from './team-of-the-week.module.css';

function PlayerCard({ player, teamShortName }: { player: TeamOfTheWeekPlayer; teamShortName: string }) {
    const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`;

    return (
        <Link to={`/players/${player.code}`} className={styles.playerCard}>
            <div className={styles.photoWrapper}>
                <img src={photoUrl} alt={player.web_name} className={styles.photo} loading="lazy" />
            </div>
            <span className={styles.name}>{player.web_name}</span>
            <span className={styles.team}>
                {teamShortName} | {player.position}
            </span>
            {player.manager_name && <span className={styles.manager}>{player.manager_name}</span>}
            <span className={styles.pointsBadge}>{player.points} pts</span>
        </Link>
    );
}

function FormationRow({
    players,
    teamsByCode,
    wide = false,
}: {
    players: TeamOfTheWeekPlayer[];
    teamsByCode: Record<number, { short_name: string }>;
    wide?: boolean;
}) {
    if (players.length === 0) return null;

    return (
        <div className={wide ? styles.rowWide : styles.row}>
            {players.map((player) => (
                <PlayerCard
                    key={player.code}
                    player={player}
                    teamShortName={teamsByCode[player.team_code]?.short_name ?? '???'}
                />
            ))}
        </div>
    );
}

export function TeamOfTheWeek({ data }: { data: TeamOfTheWeekData }) {
    const { players, teamsByCode } = data;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Team of the Week — GW{data.gameweek}</h3>
            <div className={styles.pitch}>
                <div className={styles.pitchInner}>
                    <div className={styles.goal} />

                    <div className={styles.formation}>
                        {/* CA — 2 central attackers */}
                        <FormationRow players={players.ca} teamsByCode={teamsByCode} />
                        {/* WA — 2 wide attackers, spread */}
                        <FormationRow players={players.wa} teamsByCode={teamsByCode} wide />
                        {/* MID — 2 midfielders */}
                        <FormationRow players={players.mid} teamsByCode={teamsByCode} />
                        {/* FB — 2 fullbacks, spread */}
                        <FormationRow players={players.fb} teamsByCode={teamsByCode} wide />
                        {/* CB — 2 centre-backs */}
                        <FormationRow players={players.cb} teamsByCode={teamsByCode} />
                        {/* GK — 1 goalkeeper */}
                        <FormationRow players={players.gk} teamsByCode={teamsByCode} />
                    </div>

                    <div className={styles.penaltyArea} />
                </div>
            </div>
        </div>
    );
}
