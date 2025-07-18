import type React from 'react';
import { Link } from 'react-router';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { getPositionColor } from '../../scoring/lib';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { CustomPosition } from '../types/player-types';
import styles from './player.module.css';

function PositionBadge({ position, children }: { position: CustomPosition; children: React.ReactNode }) {
    return <span className={`${styles.positionBadge} ${styles[position.toLowerCase()]}`}>{children}</span>;
}

export const PlayerSummary = ({
    teamsByCode,
    fplPlayersByCode,
    player,
    onLoanTo,
    onLoanFrom,
}: {
    teamsByCode: Record<number, FplTeam>;
    fplPlayersByCode?: Record<number, EnhancedPlayerData>;
    player: any;
    onLoanTo?: string;
    onLoanFrom?: string;
}) => {
    const img = `${`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.playerCode || player.code}.png`}`;
    return (
        <div
            className={styles.player_cell}
            style={
                {
                    '--position-color': getPositionColor(player.playerPosition || player.draft.position),
                    '--position-color-light': `${getPositionColor(player.playerPosition || player.draft.position)}40`, // Add 40 for 25% opacity
                } as React.CSSProperties
            }
        >
            <div style={{ position: 'relative' }}>
                <img src={img} loading="lazy" alt="" width={35} />

                {onLoanTo && <div className={styles.loanIndicator}>On Loan to {onLoanTo}</div>}
                {onLoanFrom && <div className={styles.loanIndicator}>On Loan from {onLoanFrom}</div>}
            </div>
            <PositionBadge position={player.playerPosition || player.draft.position}>
                {player.playerPosition || player.draft.position}
            </PositionBadge>
            <div className={styles.player_cell_details}>
                <div className={styles.player_name}>{player.playerName || player.web_name}</div>
                <div className={styles.player_details}>
                    <span className={styles.team}>
                        {fplPlayersByCode
                            ? teamsByCode[fplPlayersByCode[player.playerCode].team_code].name
                            : teamsByCode[player.team_code].name || teamsByCode[player.team_code]}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const Player = ({
    team,
    player,
    position,
}: {
    team: FplTeam;
    player: EnhancedPlayerData;
    position: CustomPosition;
}) => {
    const img = `${`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}`;
    const playerName = `${player.first_name} ${player.second_name}`;
    return (
        <div className={`${styles.player__large} ${styles[position.toLowerCase()]}`}>
            <div className={styles.player_cell}>
                <img src={img} loading="lazy" alt="" width={70} />
                <span className={styles.player_cell_details}>
                    <h1 className={styles.player_name}>
                        <Link
                            target={'_blank'}
                            to={`https://fantasy.premierleague.com/api/element-summary/${player.id}/`}
                        >
                            {player.web_name}
                            <div className={styles.player_fullname}>{playerName}</div>
                        </Link>
                    </h1>

                    <div className={styles.playerMeta}>
                        <PositionBadge position={position}>{position}</PositionBadge>
                        <span className={styles.team}>{team.name}</span>
                    </div>
                </span>
            </div>
        </div>
    );
};
