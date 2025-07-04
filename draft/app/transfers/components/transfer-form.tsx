// app/transfers/components/transfer-form.tsx

import { useState } from 'react';
import { useFetcher, useSearchParams } from 'react-router';
import { SelectUser } from '../../_shared/components/select-user';
import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type {
    DivisionId,
    DivisionSheetData,
    ManagerId,
    PositionSlotKey,
    RosterByManagerId,
    RosterPlayer,
    TeamRoster,
    UserTeamsSheetData,
} from '../../teams/types/team-types';
import { getPlayerOwnership } from '../lib/get-player-ownership';
import type { OwnedPlayersByCode, PlayerSelectionState, TransferValidationResult } from '../types/transfer-form-types';
import type { TransferType } from '../types/transfer-types';
import { LoanInfoPanel } from './loan-info-panel';
import { PlayerInSelector } from './player-in-selector';
import { PlayerOutSelector } from './player-out-selector';
import styles from './transfer-form.module.css';
import { TransferTypeSelector } from './transfer-type-selector';

interface TransferFormProps {
    divisions: DivisionSheetData[];
    managers: UserTeamsSheetData[];
    currentGameweek: number;
    availableGameweeks: number[];
    gameweekData: GameWeekData;
    selectedDivision: DivisionId;
    selectedManager: ManagerId;
    managerRoster?: TeamRoster;
    availablePlayers: EnhancedPlayerData[];
    isBeforeDeadline: boolean;
    divisionRosters: RosterByManagerId;
    teamsByCode: Record<FplTeam['code'], FplTeam>;
}

interface LoanSelectionState {
    loanPlayer: RosterPlayer | EnhancedPlayerData | null;
    loanToManager: ManagerId | null;
    loanFromManager: ManagerId | null;
}

export function TransferForm({
    managers,
    selectedDivision,
    selectedManager,
    managerRoster,
    availablePlayers,
    isBeforeDeadline,
    divisionRosters,
    teamsByCode,
}: TransferFormProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const fetcher = useFetcher();
    const TransferType: TransferType = (searchParams.get('transferType') as TransferType) || 'TRANSFER';

    const [playerSelection, setPlayerSelection] = useState<PlayerSelectionState>({
        playerOut: null,
        playerIn: null,
    });

    const [loanSelection, setLoanSelection] = useState<LoanSelectionState>({
        loanPlayer: null,
        loanToManager: null,
        loanFromManager: null,
    });

    const [comment, setComment] = useState('');
    const [validation, setValidation] = useState<TransferValidationResult>({
        isValid: true,
        warnings: [],
        errors: [],
        blockingIssues: [],
    });

    // Get managers for selected division
    const divisionsManagers = managers.filter((m) => m.divisionId === selectedDivision);
    const currentManager = divisionsManagers.find((m) => m.userId === selectedManager);
    const ownedPlayersByCode = Object.entries(divisionRosters).reduce((acc: OwnedPlayersByCode, [managerId, team]) => {
        (Object.keys(team.roster) as PositionSlotKey[]).forEach((slotKey) => {
            const slot = team.roster[slotKey];
            acc[slot.player.playerCode] = { managerId, slotKey, slot };
        });

        return acc;
    }, {});

    const handleManagerChange = (managerId: ManagerId) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('manager', managerId);
        setSearchParams(newParams);

        // Reset player selection when manager changes
        setPlayerSelection({
            playerOut: null,
            playerIn: null,
        });

        setLoanSelection({
            loanPlayer: null,
            loanToManager: null,
            loanFromManager: null,
        });
    };

    const handleBorrowingManagerChange = (managerId: ManagerId) => {
        setLoanSelection((curr) => ({
            ...curr,
            loanToManager: managerId,
        }));
    };

    const handlePlayerOutChange = (playerOut: RosterPlayer | null) => {
        setPlayerSelection((prev) => ({
            ...prev,
            playerOut,
        }));
    };

    const handlePlayerInChange = (playerIn: EnhancedPlayerData | null) => {
        setPlayerSelection((prev) => ({
            ...prev,
            playerIn,
        }));

        // Auto-determine loan relationships for owned players
        if (playerIn && TransferType === 'LOAN_START') {
            const ownership = getPlayerOwnership(playerIn, ownedPlayersByCode);
            if (ownership.ownerId && ownership.ownerId !== selectedManager) {
                setLoanSelection({
                    loanPlayer: playerIn,
                    loanToManager: selectedManager,
                    loanFromManager: ownership.ownerId,
                });
            } else if (!ownership.ownerId) {
                setLoanSelection({
                    loanPlayer: playerSelection.playerOut,
                    loanToManager: null,
                    loanFromManager: selectedManager,
                });
            }
        }
    };

    const handleTransferTypeChange = (transferType: TransferType) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('transferType', transferType);
        setSearchParams(newParams);

        // Reset loan selection when changing transfer type
        if (transferType !== 'LOAN_START' && transferType !== 'LOAN_FINISH') {
            setLoanSelection({
                loanPlayer: null,
                loanToManager: null,
                loanFromManager: null,
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validation.isValid || validation.blockingIssues.length > 0) {
            return;
        }

        const formData = new FormData();
        formData.append('actionType', 'submitTransfer');
        formData.append('divisionId', selectedDivision);
        formData.append('managerId', selectedManager);
        formData.append('transferType', TransferType || 'Transfer');
        formData.append('playerOutCode', playerSelection.playerOut?.playerCode.toString() || '');
        formData.append('playerInCode', playerSelection.playerIn?.code.toString() || '');
        formData.append('comment', comment);

        // Add loan fields for loan transfers
        if (TransferType === 'LOAN_START') {
            formData.append('onLoanTo', loanSelection.loanToManager || '');
            formData.append('onLoanFrom', loanSelection.loanFromManager || '');
        }

        fetcher.submit(formData, { method: 'post' });
    };

    // Determine if this is a loan transfer type
    const isLoanTransfer = TransferType === 'LOAN_START' || TransferType === 'LOAN_FINISH';
    const canSubmit =
        !validation.isValid ||
        validation.blockingIssues.length > 0 ||
        !isBeforeDeadline ||
        fetcher.state === 'submitting';
    return (
        <div className={styles.transferForm}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                    <SelectUser
                        selectedUser={selectedManager}
                        users={divisionsManagers}
                        handleUserChange={handleManagerChange}
                    />
                </div>

                <div className={styles.section}>
                    <TransferTypeSelector selectedType={TransferType} onTypeChange={handleTransferTypeChange} />
                </div>

                {/* Player Selection */}
                {selectedManager && managerRoster && (
                    <>
                        <div className={styles.section}>
                            <PlayerOutSelector
                                roster={managerRoster}
                                selectedPlayer={playerSelection.playerOut}
                                onPlayerChange={handlePlayerOutChange}
                                transferType={TransferType}
                            />
                        </div>

                        <div className={styles.section}>
                            <PlayerInSelector
                                availablePlayers={availablePlayers}
                                selectedPlayer={playerSelection.playerIn}
                                onPlayerChange={handlePlayerInChange}
                                transferType={TransferType}
                                playerOut={playerSelection.playerOut}
                                ownedPlayersByCode={ownedPlayersByCode}
                                teamsByCode={teamsByCode}
                            />
                        </div>
                    </>
                )}

                {/* Comment */}
                <div className={styles.section}>
                    <label className={styles.label} htmlFor={'comment'}>
                        Comment
                    </label>
                    <textarea
                        id={'comment'}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className={styles.textarea}
                        placeholder="Optional comment about this transfer..."
                        rows={3}
                    />
                </div>

                {/* Loan Information Panel */}
                {isLoanTransfer && (
                    <LoanInfoPanel
                        transferType={TransferType}
                        currentManager={currentManager}
                        loanSelection={loanSelection}
                        managers={divisionsManagers}
                        managerSelector={
                            <SelectUser
                                selectedUser={selectedManager}
                                users={divisionsManagers.filter((m) => m.userId !== selectedManager)}
                                handleUserChange={handleBorrowingManagerChange}
                            />
                        }
                    />
                )}

                {/* Validation Messages */}
                {(validation.errors.length > 0 || validation.blockingIssues.length > 0 || !isBeforeDeadline) && (
                    <div className={styles.validationErrors}>
                        {!isBeforeDeadline && <div className={styles.blockingIssue}>🚫 Missed the Deadline</div>}
                        {validation.blockingIssues.map((issue, index) => (
                            <div key={index} className={styles.blockingIssue}>
                                🚫 {issue}
                            </div>
                        ))}
                        {validation.errors.map((error, index) => (
                            <div key={index} className={styles.error}>
                                ❌ {error}
                            </div>
                        ))}
                    </div>
                )}

                {/* Submit Button */}
                <div className={styles.section}>
                    <button type="submit" disabled={canSubmit} className={styles.submitButton}>
                        {fetcher.state === 'submitting' ? 'Submitting...' : 'Submit Transfer'}
                    </button>
                </div>
            </form>
        </div>
    );
}
