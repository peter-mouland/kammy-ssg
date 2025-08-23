// app/transfers/components/transfer-form.tsx

import type * as React from 'react';
import { useEffect, useState } from 'react';
import { useFetcher, useSearchParams } from 'react-router';
import { SelectUser } from '../../_shared/components/select-user';
import { ToastManager, useToast } from '../../_shared/components/toast-manager';
import { playCelebrationSound } from '../../_shared/lib/audio/celebration-sounds';
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
import type { TransferRuleContext } from '../types/transfer-rule-types';
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
    selectedGameweekData: GameWeekData;
    selectedDivision: DivisionId;
    selectedManager: ManagerId;
    managerRoster?: TeamRoster;
    availablePlayers: EnhancedPlayerData[];
    isBeforeDeadline: boolean;
    divisionRosters: RosterByManagerId;
    teamsByCode: Record<FplTeam['code'], FplTeam>;
    validationContext: Omit<TransferRuleContext, 'transfer'>;
}

interface LoanSelectionState {
    loanPlayer: RosterPlayer | EnhancedPlayerData | null;
    loanToManager: ManagerId | null;
    loanFromManager: ManagerId | null;
}

const INITIAL_PLAYER_SELECTION: PlayerSelectionState = {
    playerOut: null,
    playerIn: null,
};

const INITIAL_LOAN_SELECTION: LoanSelectionState = {
    loanPlayer: null,
    loanToManager: null,
    loanFromManager: null,
};

const INITIAL_VALIDATION: TransferValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
    blockingIssues: [],
};

export function TransferForm({
    managers,
    selectedDivision,
    selectedManager,
    managerRoster,
    availablePlayers,
    isBeforeDeadline,
    divisionRosters,
    teamsByCode,
    validationContext,
}: TransferFormProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const fetcher = useFetcher();
    const { showToast } = useToast();
    const TransferType: TransferType = (searchParams.get('transferType') as TransferType) || 'TRANSFER';

    const [playerSelection, setPlayerSelection] = useState<PlayerSelectionState>(INITIAL_PLAYER_SELECTION);
    const [loanSelection, setLoanSelection] = useState<LoanSelectionState>(INITIAL_LOAN_SELECTION);
    const [comment, setComment] = useState('');
    const [validation, setValidation] = useState<TransferValidationResult>(INITIAL_VALIDATION);

    const playersByCode: Record<number, EnhancedPlayerData> = availablePlayers.reduce(
        (acc, player) => ({ ...acc, [player.code]: player }),
        {},
    );
    const divisionsManagers = managers.filter((m) => m.divisionId === selectedDivision);
    const currentManager = divisionsManagers.find((m) => m.userId === selectedManager);
    const ownedPlayersByCode = Object.entries(divisionRosters).reduce((acc: OwnedPlayersByCode, [managerId, team]) => {
        (Object.keys(team.roster) as PositionSlotKey[]).forEach((slotKey) => {
            const slot = team.roster[slotKey];
            acc[slot.player.playerCode] = { managerId, slotKey, slot };
        });

        return acc;
    }, {});

    // Clear form after successful submission
    const clearForm = () => {
        setPlayerSelection(INITIAL_PLAYER_SELECTION);
        setLoanSelection(INITIAL_LOAN_SELECTION);
        setComment('');
        setValidation(INITIAL_VALIDATION);
    };

    // Handle form submission response
    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data) {
            const result = fetcher.data;

            if (result.success) {
                // Success: Clear form, show toast with sound
                clearForm();
                playCelebrationSound();
                showToast({
                    type: 'success',
                    message: result.message || 'Transfer submitted successfully!',
                    duration: 5000,
                });
            } else if (result.error) {
                // Error: Show error toast
                showToast({
                    type: 'error',
                    message: result.error,
                    duration: 7000,
                });
            }
        }
    }, [fetcher.state, fetcher.data, showToast]);

    // const handleManagerChange = (managerId: ManagerId) => {
    //     const newParams = new URLSearchParams(searchParams);
    //     newParams.set('manager', managerId);
    //     setSearchParams(newParams);
    //
    //     // Reset player selection when manager changes
    //     setPlayerSelection(INITIAL_PLAYER_SELECTION);
    //     setLoanSelection(INITIAL_LOAN_SELECTION);
    // };

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
                    loanToManager: null, // loan to is to be only used for playerOut
                    loanFromManager: ownership.ownerId,
                });
            } else if (!ownership.ownerId) {
                setLoanSelection({
                    loanPlayer: playerSelection.playerOut,
                    loanToManager: null, // loan to is to be only used for playerOut
                    loanFromManager: null,
                });
            }
        }
    };

    const handleTransferTypeChange = (transferType: TransferType) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('transferType', transferType);
        setSearchParams(newParams);

        // Reset loan selection when changing transfer type
        if (transferType !== 'LOAN_START' && transferType !== 'LOAN_END') {
            setLoanSelection(INITIAL_LOAN_SELECTION);
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

        // Optimistic update: immediately add to transfer list
        if (playerSelection.playerOut && playerSelection.playerIn) {
            showToast({
                type: 'info',
                message: 'Submitting transfer...',
                duration: 2000,
            });
        }

        fetcher.submit(formData, { method: 'post' });
    };

    // Determine if this is a loan transfer type
    const isLoanTransfer = TransferType === 'LOAN_START' || TransferType === 'LOAN_END';
    const canSubmit =
        !validation.isValid ||
        validation.blockingIssues.length > 0 ||
        !isBeforeDeadline ||
        fetcher.state === 'submitting' ||
        !playerSelection.playerOut ||
        !playerSelection.playerIn;

    return (
        <div>
            <ToastManager maxToasts={3} />
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                    <TransferTypeSelector selectedType={TransferType} onTypeChange={handleTransferTypeChange} />
                </div>

                {/* Player Selection */}
                {selectedManager && managerRoster && (
                    <>
                        <div className={styles.section}>
                            <PlayerOutSelector
                                playersByCode={playersByCode}
                                teamsByCode={teamsByCode}
                                roster={managerRoster}
                                selectedPlayer={playerSelection.playerOut}
                                onPlayerChange={handlePlayerOutChange}
                                transferType={TransferType}
                            />
                        </div>
                        <hr />
                        <div className={styles.section}>
                            <PlayerInSelector
                                availablePlayers={availablePlayers}
                                selectedPlayer={playerSelection.playerIn}
                                onPlayerChange={handlePlayerInChange}
                                transferType={TransferType}
                                playerOut={playerSelection.playerOut}
                                ownedPlayersByCode={ownedPlayersByCode}
                                teamsByCode={teamsByCode}
                                managerId={selectedManager}
                                validationContext={validationContext}
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
                                selectedUser={loanSelection.loanToManager}
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
                    <button
                        type="submit"
                        disabled={canSubmit}
                        className={`${styles.submitButton} ${fetcher.state === 'submitting' ? styles.loading : ''}`}
                    >
                        {fetcher.state === 'submitting' ? 'Submitting...' : 'Submit Transfer'}
                    </button>
                </div>
            </form>
        </div>
    );
}
