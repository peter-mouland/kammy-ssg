// app/transfers/components/loan-info-panel.tsx

import type { ReactNode } from 'react';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { ManagerId, RosterPlayer, UserTeamsSheetData } from '../../teams/types/team-types';
import type { TransferType } from '../types/transfer-types';
import styles from './loan-info-panel.module.css';

interface LoanInfoPanelProps {
    transferType: TransferType;
    currentManager: UserTeamsSheetData | undefined;
    loanSelection: {
        loanPlayer: RosterPlayer | EnhancedPlayerData | null;
        loanToManager: ManagerId | null;
        loanFromManager: ManagerId | null;
    };
    managers: UserTeamsSheetData[];
    managerSelector: ReactNode;
}

export function LoanInfoPanel({
    transferType,
    currentManager,
    loanSelection,
    managers,
    managerSelector,
}: LoanInfoPanelProps) {
    const getManagerName = (userId: string | null) => {
        if (!userId) return 'Unknown';
        const manager = managers.find((m) => m.userId === userId);
        return manager ? `${manager.userName} (${manager.teamName})` : userId;
    };

    if (transferType === 'LOAN_START') {
        const playerOnLoanName =
            loanSelection.loanPlayer && 'playerName' in loanSelection.loanPlayer
                ? loanSelection.loanPlayer?.playerName
                : loanSelection.loanPlayer?.web_name;
        const loanIn = !!loanSelection.loanFromManager;
        return (
            <div className={styles.loanPanel}>
                <div className={styles.loanHeader}>
                    <span className={styles.loanIcon}>🔄</span>
                    <h3 className={styles.loanTitle}>Loan Agreement</h3>
                </div>

                <div className={styles.loanExplanation}>
                    <p className={styles.explanationText}>
                        Would you like to <strong>loan your player to another manager</strong>?
                    </p>
                </div>

                <div className={styles.loanDetails}>
                    <div className={styles.loanRow}>
                        <span className={styles.loanLabel}>Player:</span>
                        <span className={styles.loanValue}>{playerOnLoanName}</span>
                    </div>
                    <div className={styles.loanRow}>
                        <span className={styles.loanLabel}>Lending Manager:</span>
                        <span className={styles.loanValue}>{getManagerName(currentManager.userId)}</span>
                    </div>
                    <div className={styles.loanRow}>
                        <span className={styles.loanLabel}>Borrowing Manager:</span>
                        <span className={styles.loanValue}>{managerSelector}</span>
                    </div>
                </div>
                {loanIn && (
                    <>
                        <div className={styles.loanExplanation}>
                            <p className={styles.explanationText}>
                                You are requesting to <strong>loan a player from another manager</strong>.
                            </p>
                        </div>

                        <div className={styles.loanDetails}>
                            <div className={styles.loanRow}>
                                <span className={styles.loanLabel}>Player on Loan:</span>
                                <span className={styles.loanValue}>{playerOnLoanName}</span>
                            </div>
                            <div className={styles.loanRow}>
                                <span className={styles.loanLabel}>Lending Manager:</span>
                                <span className={styles.loanValue}>
                                    {getManagerName(loanSelection.loanFromManager)}
                                </span>
                            </div>
                            <div className={styles.loanRow}>
                                <span className={styles.loanLabel}>Borrowing Manager:</span>
                                <span className={styles.loanValue}>{getManagerName(currentManager.userId)}</span>
                            </div>
                        </div>
                    </>
                )}

                {loanSelection.loanToManager && loanSelection.loanFromManager && (
                    <div className={styles.loanInstructions}>
                        <div className={styles.instructionTitle}>📋 Next Steps:</div>
                        <ol className={styles.instructionList}>
                            <li>Submit your loan request</li>
                            <li>The other manager must submit a "Loan Start" request with the same player</li>
                            <li>Admin will approve both transfers together</li>
                        </ol>
                    </div>
                )}

                <div className={styles.loanRules}>
                    <div className={styles.rulesTitle}>⚠️ Loan Rules:</div>
                    <ul className={styles.rulesList}>
                        <li>A manager can only loan one player at a time</li>
                        <li>Loaned players score points for the borrowing team</li>
                        <li>Loans will be ended when both managers submit a "Loan Finish" transfer</li>
                    </ul>
                </div>
            </div>
        );
    }

    if (transferType === 'LOAN_FINISH') {
        return (
            <div className={styles.loanPanel}>
                <div className={styles.loanHeader}>
                    <span className={styles.loanIcon}>🔚</span>
                    <h3 className={styles.loanTitle}>End Loan Agreement</h3>
                </div>

                <div className={styles.loanExplanation}>
                    <p className={styles.explanationText}>
                        You are ending a loan agreement. The loaned player will return to their original team and any
                        exchanged player will be removed.
                    </p>
                </div>

                <div className={styles.loanInstructions}>
                    <div className={styles.instructionTitle}>📋 What happens:</div>
                    <ol className={styles.instructionList}>
                        <li>The loaned player returns to their original team</li>
                        <li>Points will now count for the original team</li>
                        <li>Any player exchange is reversed</li>
                    </ol>
                </div>
            </div>
        );
    }

    return null;
}
