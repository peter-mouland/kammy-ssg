/* Location: app/teams/components/loan-status.tsx */

// /teams/components/loan-status.tsx
import type React from 'react';
import type { RosterPlayer } from '../types/team-types';
import styles from './loan-status.module.css';
import { PlayerCard } from './player-card';

interface LoanStatusProps {
    loanedOut: RosterPlayer[];
    loanedIn: RosterPlayer[];
    gameweek: number;
}

export const LoanStatus: React.FC<LoanStatusProps> = ({ loanedOut, loanedIn, gameweek }) => {
    return (
        <div className={styles.loanStatus}>
            <h3 className={styles.title}>
                Loan Transfers
                <span className={styles.loanCount}>{loanedOut.length + loanedIn.length} active</span>
            </h3>

            {/* Loaned Out Players */}
            {loanedOut.length > 0 && (
                <div className={styles.loanSection}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>
                            <span className={styles.loanIcon}>📤</span>
                            Loaned Out
                            <span className={styles.playerCount}>({loanedOut.length})</span>
                        </div>
                        <div className={styles.sectionDescription}>Players temporarily transferred to other teams</div>
                    </div>

                    <div className={styles.playersList}>
                        {loanedOut.map((player) => (
                            <div key={`${player.playerCode}-${gameweek}`} className={styles.loanedPlayer}>
                                <PlayerCard player={player} isSubstitute={player.isSub} gameweek={gameweek} />
                                <div className={styles.loanDetails}>
                                    <div className={styles.loanTo}>
                                        <span className={styles.loanLabel}>To:</span>
                                        <span className={styles.loanTeam}>{player.onLoanTo}</span>
                                    </div>
                                    {player.onLoanStart && (
                                        <div className={styles.loanDate}>
                                            <span className={styles.loanLabel}>Since:</span>
                                            <span className={styles.loanTime}>
                                                {new Date(player.onLoanStart).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Loaned In Players */}
            {loanedIn.length > 0 && (
                <div className={styles.loanSection}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>
                            <span className={styles.loanIcon}>📥</span>
                            Loaned In
                            <span className={styles.playerCount}>({loanedIn.length})</span>
                        </div>
                        <div className={styles.sectionDescription}>Players temporarily acquired from other teams</div>
                    </div>

                    <div className={styles.playersList}>
                        {loanedIn.map((player) => (
                            <div key={`${player.playerCode}-${gameweek}`} className={styles.loanedPlayer}>
                                <PlayerCard player={player} isSubstitute={player.isSub} gameweek={gameweek} />
                                <div className={styles.loanDetails}>
                                    <div className={styles.loanFrom}>
                                        <span className={styles.loanLabel}>From:</span>
                                        <span className={styles.loanTeam}>{player.onLoanFrom}</span>
                                    </div>
                                    {player.onLoanStart && (
                                        <div className={styles.loanDate}>
                                            <span className={styles.loanLabel}>Since:</span>
                                            <span className={styles.loanTime}>
                                                {new Date(player.onLoanStart).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Loan System Info */}
            <div className={styles.loanInfo}>
                <div className={styles.infoTitle}>About Loans</div>
                <div className={styles.infoText}>
                    Loan transfers allow temporary player exchanges between teams. Loaned players contribute points to
                    their temporary team but return to their original team at the end of the loan period.
                </div>
            </div>
        </div>
    );
};
