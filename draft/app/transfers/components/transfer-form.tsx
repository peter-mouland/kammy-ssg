// app/transfers/components/transfer-form.tsx

import type * as React from 'react';
import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';
import { SelectUser } from '../../_shared/components/select-user';
import { ToastManager, useToast } from '../../_shared/components/toast-manager';
import { playCelebrationSound } from '../../_shared/lib/audio/celebration-sounds';
import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import { PlayerSummary } from '../../players/components/player';
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

export type JourneyPath = 'team-first' | 'player-list-first';

type JourneyStep = 'first-selector' | 'second-selector' | 'review';

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
    journeyPath: JourneyPath;
    onExit: () => void;
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

const STEP_TITLES: Record<JourneyStep, Record<JourneyPath, string>> = {
    'first-selector': {
        'team-first': 'Select player from your team',
        'player-list-first': 'Select player from list',
    },
    'second-selector': {
        'team-first': 'Select player to bring in',
        'player-list-first': 'Select player to remove',
    },
    review: {
        'team-first': 'Review and submit',
        'player-list-first': 'Review and submit',
    },
};

function canContinue(step: JourneyStep, journeyPath: JourneyPath, playerSelection: PlayerSelectionState): boolean {
    switch (step) {
        case 'first-selector':
            return journeyPath === 'team-first'
                ? playerSelection.playerOut !== null
                : playerSelection.playerIn !== null;
        case 'second-selector':
            return journeyPath === 'team-first'
                ? playerSelection.playerIn !== null
                : playerSelection.playerOut !== null;
        case 'review':
            return false;
    }
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
    validationContext,
    journeyPath,
    onExit,
}: TransferFormProps) {
    const fetcher = useFetcher();
    const { showToast } = useToast();

    const [step, setStep] = useState<JourneyStep>('first-selector');
    const [transferType, setTransferType] = useState<TransferType>('TRANSFER');
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

    const getLoanSelectionForTransfer = (
        nextTransferType: TransferType,
        nextPlayerSelection: PlayerSelectionState,
    ): LoanSelectionState => {
        if (nextTransferType !== 'LOAN_START') {
            return INITIAL_LOAN_SELECTION;
        }

        const playerIn = nextPlayerSelection.playerIn;
        if (!playerIn) {
            return INITIAL_LOAN_SELECTION;
        }

        const ownership = getPlayerOwnership(playerIn, ownedPlayersByCode);
        if (ownership.ownerId && ownership.ownerId !== selectedManager) {
            return {
                loanPlayer: playerIn,
                loanToManager: null,
                loanFromManager: ownership.ownerId,
            };
        }

        if (!ownership.ownerId && nextPlayerSelection.playerOut) {
            return {
                loanPlayer: nextPlayerSelection.playerOut,
                loanToManager: null,
                loanFromManager: null,
            };
        }

        return INITIAL_LOAN_SELECTION;
    };

    const clearForm = () => {
        setStep('first-selector');
        setTransferType('TRANSFER');
        setPlayerSelection(INITIAL_PLAYER_SELECTION);
        setLoanSelection(INITIAL_LOAN_SELECTION);
        setComment('');
        setValidation(INITIAL_VALIDATION);
    };

    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data) {
            const result = fetcher.data;

            if (result.success) {
                clearForm();
                onExit();
                playCelebrationSound();
                showToast({
                    type: 'success',
                    message: result.message || 'Transfer submitted successfully!',
                    duration: 5000,
                });
            } else if (result.error) {
                showToast({
                    type: 'error',
                    message: result.error,
                    duration: 7000,
                });
            }
        }
    }, [fetcher.state, fetcher.data, showToast, onExit]);

    const handleBorrowingManagerChange = (managerId: ManagerId) => {
        setLoanSelection((curr) => ({
            ...curr,
            loanToManager: managerId,
        }));
    };

    const handlePlayerOutChange = (playerOut: RosterPlayer | null) => {
        const nextPlayerSelection = {
            ...playerSelection,
            playerOut,
        };

        setPlayerSelection(nextPlayerSelection);
        setLoanSelection(getLoanSelectionForTransfer(transferType, nextPlayerSelection));
    };

    const handlePlayerInChange = (playerIn: EnhancedPlayerData | null) => {
        const nextPlayerSelection = {
            ...playerSelection,
            playerIn,
        };

        setPlayerSelection(nextPlayerSelection);
        setLoanSelection(getLoanSelectionForTransfer(transferType, nextPlayerSelection));
    };

    const handleTransferTypeChange = (nextTransferType: TransferType) => {
        setTransferType(nextTransferType);
        setLoanSelection(getLoanSelectionForTransfer(nextTransferType, playerSelection));
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
        formData.append('transferType', transferType || 'Transfer');
        formData.append('playerOutCode', playerSelection.playerOut?.playerCode.toString() || '');
        formData.append('playerInCode', playerSelection.playerIn?.code.toString() || '');
        formData.append('comment', comment);

        if (transferType === 'LOAN_START') {
            formData.append('onLoanTo', loanSelection.loanToManager || '');
            formData.append('onLoanFrom', loanSelection.loanFromManager || '');
        }

        if (playerSelection.playerOut && playerSelection.playerIn) {
            showToast({
                type: 'info',
                message: 'Submitting transfer...',
                duration: 2000,
            });
        }

        fetcher.submit(formData, { method: 'post' });
    };

    const goBack = () => {
        if (step === 'first-selector') {
            onExit();
            return;
        }
        if (step === 'second-selector') {
            setStep('first-selector');
            return;
        }
        setStep('second-selector');
    };

    const goForward = () => {
        if (step === 'first-selector') {
            setStep('second-selector');
            return;
        }
        if (step === 'second-selector') {
            setStep('review');
        }
    };

    const isLoanTransfer = transferType === 'LOAN_START' || transferType === 'LOAN_END';
    const canSubmit = fetcher.state === 'submitting' || !playerSelection.playerOut || !playerSelection.playerIn;
    const showContinue = step !== 'review' && canContinue(step, journeyPath, playerSelection);
    const showTransferTypeSelector = step === 'first-selector' && canContinue(step, journeyPath, playerSelection);

    const renderFirstSelector = () => {
        if (!selectedManager || !managerRoster) {
            return null;
        }

        if (journeyPath === 'team-first') {
            return (
                <PlayerOutSelector
                    playersByCode={playersByCode}
                    teamsByCode={teamsByCode}
                    roster={managerRoster}
                    selectedPlayer={playerSelection.playerOut}
                    onPlayerChange={handlePlayerOutChange}
                    transferType={transferType}
                />
            );
        }

        return (
            <PlayerInSelector
                availablePlayers={availablePlayers}
                selectedPlayer={playerSelection.playerIn}
                onPlayerChange={handlePlayerInChange}
                transferType={transferType}
                playerOut={playerSelection.playerOut}
                ownedPlayersByCode={ownedPlayersByCode}
                teamsByCode={teamsByCode}
                managerId={selectedManager}
                validationContext={validationContext}
            />
        );
    };

    const renderSecondSelector = () => {
        if (!selectedManager || !managerRoster) {
            return null;
        }

        if (journeyPath === 'team-first') {
            return (
                <PlayerInSelector
                    availablePlayers={availablePlayers}
                    selectedPlayer={playerSelection.playerIn}
                    onPlayerChange={handlePlayerInChange}
                    transferType={transferType}
                    playerOut={playerSelection.playerOut}
                    ownedPlayersByCode={ownedPlayersByCode}
                    teamsByCode={teamsByCode}
                    managerId={selectedManager}
                    validationContext={validationContext}
                />
            );
        }

        return (
            <PlayerOutSelector
                playersByCode={playersByCode}
                teamsByCode={teamsByCode}
                roster={managerRoster}
                selectedPlayer={playerSelection.playerOut}
                onPlayerChange={handlePlayerOutChange}
                transferType={transferType}
            />
        );
    };

    const renderReview = () => {
        const playerOutFpl = playerSelection.playerOut ? playersByCode[playerSelection.playerOut.playerCode] : null;
        const playerIn = playerSelection.playerIn;

        return (
            <>
                <div className={styles.reviewSummary}>
                    <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>Type</span>
                        <span className={styles.reviewValue}>{transferType}</span>
                    </div>
                    {playerOutFpl && playerSelection.playerOut ? (
                        <div className={styles.reviewRow}>
                            <span className={styles.reviewLabel}>Player out</span>
                            <PlayerSummary
                                player={{ ...playerOutFpl, ...playerSelection.playerOut }}
                                teamsByCode={teamsByCode}
                            />
                        </div>
                    ) : null}
                    {playerIn ? (
                        <div className={styles.reviewRow}>
                            <span className={styles.reviewLabel}>Player in</span>
                            <PlayerSummary player={playerIn} teamsByCode={teamsByCode} />
                        </div>
                    ) : null}
                </div>

                <div className={styles.section}>
                    <label className={styles.label} htmlFor="comment">
                        Comment
                    </label>
                    <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className={styles.textarea}
                        placeholder="Optional comment about this transfer..."
                        rows={3}
                    />
                </div>

                {isLoanTransfer ? (
                    <LoanInfoPanel
                        transferType={transferType}
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
                ) : null}

                {(playerIn && !playerIn.eligibility.isEligible) || !isBeforeDeadline ? (
                    <div className={styles.validationErrors}>
                        {isBeforeDeadline ? null : <div className={styles.blockingIssue}>🚫 Missed the Deadline</div>}
                        {playerIn && !playerIn.eligibility.isEligible ? (
                            <div className={styles.blockingIssue}>🚫 {playerIn.eligibility.reason}</div>
                        ) : null}
                    </div>
                ) : null}

                <div className={styles.section}>
                    <button
                        type="submit"
                        disabled={canSubmit}
                        className={`${styles.submitButton} ${fetcher.state === 'submitting' ? styles.loading : ''}`}
                    >
                        {fetcher.state === 'submitting' ? 'Submitting...' : 'Submit Transfer'}
                    </button>
                </div>
            </>
        );
    };

    return (
        <div className={styles.journey}>
            <ToastManager maxToasts={3} />
            <div className={styles.journeyHeader}>
                <button type="button" className={styles.backButton} onClick={goBack}>
                    ← {step === 'first-selector' ? 'Back to hub' : 'Back'}
                </button>
                <h2 className={styles.journeyTitle}>{STEP_TITLES[step][journeyPath]}</h2>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {step === 'first-selector' ? <div className={styles.stepContent}>{renderFirstSelector()}</div> : null}
                {step === 'second-selector' ? <div className={styles.stepContent}>{renderSecondSelector()}</div> : null}
                {step === 'review' ? <div className={styles.stepContent}>{renderReview()}</div> : null}

                {showContinue ? (
                    <div className={styles.journeyFooter}>
                        {showTransferTypeSelector ? (
                            <div className={styles.inlineTransferType}>
                                <TransferTypeSelector
                                    selectedType={transferType}
                                    onTypeChange={handleTransferTypeChange}
                                />
                            </div>
                        ) : null}
                        <button type="button" className={styles.continueButton} onClick={goForward}>
                            Continue
                        </button>
                    </div>
                ) : null}
            </form>
        </div>
    );
}
