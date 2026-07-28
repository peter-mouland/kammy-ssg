// app/transfers/components/loan-status-display.tsx

import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { ManagerId, UserTeamsSheetData } from '../../_shared/types/league-types';
import { PlayerSummary } from '../../players/components/player';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { RosterPlayer } from '../../teams/types/team-types';
import styles from './loan-status-display.module.css';

type ActiveLoan = {
    player: RosterPlayer;
    to: ManagerId | null;
    from: ManagerId | null;
};

interface LoanStatusDisplayProps {
    loans: Record<RosterPlayer['playerCode'], ActiveLoan>;
    managers: UserTeamsSheetData[];
    currentManagerId: string;
    teamsByCode: Record<number, FplTeam> | null;
    fplPlayersByCode?: Record<number, EnhancedPlayerData>;
}

export function LoanStatusDisplay({
    loans,
    currentManagerId,
    teamsByCode = {},
    fplPlayersByCode = {},
}: LoanStatusDisplayProps) {
    const loanPlayerCodes = Object.keys(loans);
    const counts = loanPlayerCodes.reduce(
        (acc, playerCode) => {
            const { to, from } = loans[playerCode as unknown as number];
            return {
                ...acc,
                pendingCount: acc.pendingCount + (to && from ? 0 : 1),
                activeCount: acc.activeCount + (to && from ? 1 : 0),
            };
        },
        { pendingCount: 0, activeCount: 0 },
    );

    return (
        <div className={styles.loanStatusContainer}>
            <div className={styles.header}>
                <h3 className={styles.sectionTitle}>
                    <span className={styles.loanIcon}>🔄</span>
                    Loan Status
                </h3>
                <div className={styles.summary}>
                    {counts.pendingCount > 0 && (
                        <span className={styles.pendingCount}>{counts.pendingCount} pending</span>
                    )}
                    {counts.activeCount > 0 && <span className={styles.activeCount}>{counts.activeCount} active</span>}
                </div>
            </div>

            {loanPlayerCodes.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.loansGrid}>
                        {loanPlayerCodes.map((playerCode) => {
                            const { player, to, from } = loans[playerCode as unknown as number];
                            return (
                                <div key={player.onLoanStart} className={styles.loanCard}>
                                    <div className={styles.loanStatus}>
                                        {from && to && <span className={styles.statusActive}>Active</span>}
                                        {(!from || !to) && <span className={styles.statusPending}>Awaiting Match</span>}
                                    </div>

                                    <div className={styles.activeLoanPlayer}>
                                        <PlayerSummary
                                            teamsByCode={teamsByCode}
                                            fplPlayersByCode={fplPlayersByCode}
                                            player={player}
                                        />
                                    </div>

                                    <div className={styles.loanParties}>
                                        <div className={styles.partyInfo}>
                                            <div className={styles.partyRole}>Lending</div>
                                            <div className={styles.partyName}>
                                                {from}
                                                {from === currentManagerId && (
                                                    <span className={styles.youLabel}> (You)</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.partyInfo}>
                                            <div className={styles.partyRole}>Borrowing</div>
                                            <div className={styles.partyName}>
                                                {to}
                                                {to === currentManagerId && (
                                                    <span className={styles.youLabel}> (You)</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.loanMeta}>
                                        <div className={styles.timestamp}>
                                            Started{' '}
                                            {new Date(player.onLoanStart).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
