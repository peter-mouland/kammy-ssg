/* Location: app/teams/components/player-card.tsx */

// /teams/components/player-card.tsx
import type React from 'react';
import { Link } from 'react-router';
import type { RosterPlayer } from '../types/team-types';
import styles from './player-card.module.css';

interface PlayerCardProps {
    player: RosterPlayer;
    isSubstitute: boolean;
    gameweek: number;
    isOnPitch?: boolean;
    positionLabel?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    isSubstitute,
    gameweek,
    isOnPitch = false,
    positionLabel,
}) => {
    const isOnLoan = Boolean(player.onLoanTo);
    const isLoanedIn = Boolean(player.onLoanFrom);

    // Get display name (truncate if too long for pitch)
    const displayName = isOnPitch
        ? player.playerName.length > 12
            ? player.playerName.split(' ')[0]
            : player.playerName
        : player.playerName;
    const img = `${`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.playerCode}.png`}`;

    return (
        <div
            className={`
            ${styles.playerCard}
            ${isSubstitute ? styles.substitute : ''}
            ${isOnPitch ? styles.onPitch : ''}
            ${isOnLoan ? styles.onLoan : ''}
            ${isLoanedIn ? styles.loanedIn : ''}
        `}
        >
            {/* Position Badge (on pitch only) */}
            {isOnPitch && positionLabel && <div className={styles.positionBadge}>{positionLabel}</div>}

            {/* Player Jersey/Avatar */}
            <div className={styles.playerJersey}>
                <div className={styles.jerseyNumber}>
                    <img src={img} loading="lazy" alt="" width={35} />
                </div>
                {isOnLoan && (
                    <div className={styles.loanIndicator} title={'on loan'}>
                        {isLoanedIn ? '⬅️' : '➡️'}
                    </div>
                )}
            </div>

            {/* Player Info */}
            <div className={styles.playerInfo}>
                <Link to={`/players/${player.playerCode}`} className={styles.playerName} title={player.playerName}>
                    {displayName}
                </Link>

                {!isOnPitch && (
                    <div className={styles.playerDetails}>
                        <span className={styles.position}>{player.playerPosition?.toUpperCase()}</span>
                        {isSubstitute && <span className={styles.subBadge}>SUB</span>}
                    </div>
                )}
            </div>

            {/* Interactive hover effects */}
            <div className={styles.playerHover}>
                <div className={styles.hoverInfo}>
                    <div className={styles.fullName}>{player.playerName}</div>
                    <div className={styles.playerCode}>#{player.playerCode}</div>
                    {player.onLoanStart && (
                        <div className={styles.loanDetails}>
                            Loan started: {new Date(player.onLoanStart).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
