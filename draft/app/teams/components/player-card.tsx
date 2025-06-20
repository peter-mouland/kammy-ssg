/* Location: app/teams/components/player-card.tsx */

// /teams/components/player-card.tsx
import type React from 'react';
import type { FirestoreTeamMember } from '../types/team-types';
import styles from './player-card.module.css';

interface PlayerCardProps {
    player: FirestoreTeamMember;
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
    const isLoanedIn = player.onLoanTo && player.onLoanTo !== player.userId;

    // Get display name (truncate if too long for pitch)
    const displayName = isOnPitch
        ? player.player.length > 12
            ? player.player.split(' ')[0]
            : player.player
        : player.player;

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
                <div className={styles.jerseyNumber}>{player.playerCode.toString().slice(-2)}</div>
                {isOnLoan && <div className={styles.loanIndicator}>{isLoanedIn ? '⬅️' : '➡️'}</div>}
            </div>

            {/* Player Info */}
            <div className={styles.playerInfo}>
                <div className={styles.playerName} title={player.player}>
                    {displayName}
                </div>

                {!isOnPitch && (
                    <div className={styles.playerDetails}>
                        <span className={styles.position}>{player.playerPosition.toUpperCase()}</span>
                        {isSubstitute && <span className={styles.subBadge}>SUB</span>}
                    </div>
                )}

                {/* Loan Status */}
                {isOnLoan && !isOnPitch && (
                    <div className={styles.loanStatus}>
                        {isLoanedIn ? (
                            <span className={styles.loanIn}>On loan from</span>
                        ) : (
                            <span className={styles.loanOut}>On loan to {player.onLoanTo}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Points/Stats (if available) */}
            {gameweek > 0 && (
                <div className={styles.playerStats}>
                    <div className={styles.points}>
                        {/* This would come from scoring data */}
                        <span className={styles.pointsValue}>0</span>
                        <span className={styles.pointsLabel}>pts</span>
                    </div>
                </div>
            )}

            {/* Interactive hover effects */}
            <div className={styles.playerHover}>
                <div className={styles.hoverInfo}>
                    <div className={styles.fullName}>{player.player}</div>
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
