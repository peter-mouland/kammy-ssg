// app/transfers/components/loan-status-display.tsx

import type { UserTeamsSheetData } from '../../teams/types/team-types';
import type { ActiveLoanAgreement, PendingLoanRequest } from '../types/transfer-form-types';
import styles from './loan-status-display.module.css';

interface LoanStatusDisplayProps {
    pendingLoans: PendingLoanRequest[];
    activeLoans: ActiveLoanAgreement[];
    managers: UserTeamsSheetData[];
    currentManagerId: string;
}

export function LoanStatusDisplay({ pendingLoans, activeLoans, managers, currentManagerId }: LoanStatusDisplayProps) {
    const getManagerName = (userId: string) => {
        const manager = managers.find((m) => m.userId === userId);
        return manager ? `${manager.userName} (${manager.teamName})` : 'Unknown Manager';
    };

    // Filter loans relevant to current manager
    const relevantPendingLoans = pendingLoans.filter(
        (loan) => loan.requestingManager === currentManagerId || loan.targetManager === currentManagerId,
    );

    const relevantActiveLoans = activeLoans.filter(
        (loan) => loan.lendingManager === currentManagerId || loan.borrowingManager === currentManagerId,
    );

    if (relevantPendingLoans.length === 0 && relevantActiveLoans.length === 0) {
        return null;
    }

    return (
        <div className={styles.loanStatusContainer}>
            <h3 className={styles.sectionTitle}>
                <span className={styles.loanIcon}>🔄</span>
                Loan Status
            </h3>

            {/* Pending Loan Requests */}
            {relevantPendingLoans.length > 0 && (
                <div className={styles.loanSection}>
                    <h4 className={styles.subsectionTitle}>📋 Pending Loan Requests ({relevantPendingLoans.length})</h4>

                    {relevantPendingLoans.map((loan) => (
                        <div key={loan.id} className={styles.loanCard}>
                            <div className={styles.loanHeader}>
                                <div className={styles.loanPlayers}>
                                    <span className={styles.playerOut}>{loan.playerOut.web_name}</span>
                                    <span className={styles.arrow}>⇄</span>
                                    <span className={styles.playerIn}>{loan.playerIn.web_name}</span>
                                </div>
                                <div className={styles.loanStatus}>
                                    {loan.needsMatchingRequest ? (
                                        <span className={styles.statusPending}>Awaiting Match</span>
                                    ) : (
                                        <span className={styles.statusReady}>Ready for Approval</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.loanDetails}>
                                <div className={styles.loanParties}>
                                    <div className={styles.party}>
                                        <span className={styles.partyLabel}>Requesting:</span>
                                        <span className={styles.partyName}>
                                            {getManagerName(loan.requestingManager)}
                                            {loan.requestingManager === currentManagerId && (
                                                <span className={styles.youLabel}> (You)</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className={styles.party}>
                                        <span className={styles.partyLabel}>Target:</span>
                                        <span className={styles.partyName}>
                                            {getManagerName(loan.targetManager)}
                                            {loan.targetManager === currentManagerId && (
                                                <span className={styles.youLabel}> (You)</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.loanTimestamp}>
                                    Requested: {loan.timestamp.toLocaleDateString()} at{' '}
                                    {loan.timestamp.toLocaleTimeString()}
                                </div>

                                {loan.needsMatchingRequest && loan.targetManager === currentManagerId && (
                                    <div className={styles.actionRequired}>
                                        <span className={styles.actionIcon}>⚡</span>
                                        <span className={styles.actionText}>
                                            Action required: Submit matching loan request
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Active Loan Agreements */}
            {relevantActiveLoans.length > 0 && (
                <div className={styles.loanSection}>
                    <h4 className={styles.subsectionTitle}>✅ Active Loans ({relevantActiveLoans.length})</h4>

                    {relevantActiveLoans.map((loan) => (
                        <div key={loan.id} className={styles.loanCard}>
                            <div className={styles.loanHeader}>
                                <div className={styles.loanPlayers}>
                                    <span className={styles.playerOut}>{loan.loanedPlayer.web_name}</span>
                                    {loan.exchangedPlayer && (
                                        <>
                                            <span className={styles.arrow}>⇄</span>
                                            <span className={styles.playerIn}>{loan.exchangedPlayer.web_name}</span>
                                        </>
                                    )}
                                </div>
                                <div className={styles.loanStatus}>
                                    <span className={styles.statusActive}>Active</span>
                                </div>
                            </div>

                            <div className={styles.loanDetails}>
                                <div className={styles.loanParties}>
                                    <div className={styles.party}>
                                        <span className={styles.partyLabel}>Lending:</span>
                                        <span className={styles.partyName}>
                                            {getManagerName(loan.lendingManager)}
                                            {loan.lendingManager === currentManagerId && (
                                                <span className={styles.youLabel}> (You)</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className={styles.party}>
                                        <span className={styles.partyLabel}>Borrowing:</span>
                                        <span className={styles.partyName}>
                                            {getManagerName(loan.borrowingManager)}
                                            {loan.borrowingManager === currentManagerId && (
                                                <span className={styles.youLabel}> (You)</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.loanTimestamp}>
                                    Started: {loan.startDate.toLocaleDateString()}
                                </div>

                                <div className={styles.loanActions}>
                                    <span className={styles.actionInfo}>
                                        💡 Use "Loan Finish" to end this agreement
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
