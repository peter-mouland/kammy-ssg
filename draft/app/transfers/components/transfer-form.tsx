// app/transfers/components/transfer-form.tsx

import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useFetcher } from 'react-router';
import { SelectUser } from '../../_shared/components/select-user';
import { ToastManager, useToast } from '../../_shared/components/toast-manager';
import { playCelebrationSound } from '../../_shared/lib/audio/celebration-sounds';
import type { FplTeam, GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type {
    DivisionId,
    DivisionSheetData,
    ManagerId,
    PositionSlotKey,
    UserTeamsSheetData,
} from '../../_shared/types/league-types';
import { PlayerSummary } from '../../players/components/player';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { RosterByManagerId, RosterPlayer, TeamRoster } from '../../teams/types/team-types';
import { getGameweekLimitStatus } from '../lib/get-gameweek-limit-status';
import { getPlayerOwnership } from '../lib/get-player-ownership';
import { getTransferJourneyIssues } from '../lib/get-transfer-journey-issues';
import type { OwnedPlayersByCode, PlayerSelectionState, TransferFormValidation } from '../types/transfer-form-types';
import type { TransferRuleContext } from '../types/transfer-rule-types';
import type { TransferType } from '../types/transfer-types';
import { LoanInfoPanel } from './loan-info-panel';
import { PlayerInSelector } from './player-in-selector';
import { PlayerOutSelector } from './player-out-selector';
import styles from './transfer-form.module.css';
import { TransferTypeSelector } from './transfer-type-selector';

const JOURNEY_PATHS = {
    teamFirst: 'team-first',
    playerListFirst: 'player-list-first',
} as const;

export type JourneyPath = (typeof JOURNEY_PATHS)[keyof typeof JOURNEY_PATHS];

const JOURNEY_STEPS = {
    firstSelector: 'first-selector',
    secondSelector: 'second-selector',
    review: 'review',
} as const;

type JourneyStep = (typeof JOURNEY_STEPS)[keyof typeof JOURNEY_STEPS];

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

const INITIAL_VALIDATION: TransferFormValidation = {
    isValid: true,
    warnings: [],
    errors: [],
    blockingIssues: [],
};

const STEP_TITLES: Record<JourneyStep, Record<JourneyPath, string>> = {
    [JOURNEY_STEPS.firstSelector]: {
        [JOURNEY_PATHS.teamFirst]: 'Select player from your team',
        [JOURNEY_PATHS.playerListFirst]: 'Select player from list',
    },
    [JOURNEY_STEPS.secondSelector]: {
        [JOURNEY_PATHS.teamFirst]: 'Select player to bring in',
        [JOURNEY_PATHS.playerListFirst]: 'Select player to remove',
    },
    [JOURNEY_STEPS.review]: {
        [JOURNEY_PATHS.teamFirst]: 'Review and submit',
        [JOURNEY_PATHS.playerListFirst]: 'Review and submit',
    },
};

function canContinue(step: JourneyStep, journeyPath: JourneyPath, playerSelection: PlayerSelectionState): boolean {
    switch (step) {
        case JOURNEY_STEPS.firstSelector:
            return journeyPath === JOURNEY_PATHS.teamFirst
                ? playerSelection.playerOut !== null
                : playerSelection.playerIn !== null;
        case JOURNEY_STEPS.secondSelector:
            return journeyPath === JOURNEY_PATHS.teamFirst
                ? playerSelection.playerIn !== null
                : playerSelection.playerOut !== null;
        case JOURNEY_STEPS.review:
            return false;
    }
}

function getLoanSelectionForTransfer(
    nextTransferType: TransferType,
    nextPlayerSelection: PlayerSelectionState,
    ownedPlayersByCode: OwnedPlayersByCode,
    selectedManager: ManagerId,
): LoanSelectionState {
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
}

interface SelectorStepProps {
    availablePlayers: EnhancedPlayerData[];
    selectedManager: ManagerId;
    managerRoster?: TeamRoster;
    journeyPath: JourneyPath;
    playersByCode: Record<number, EnhancedPlayerData>;
    teamsByCode: Record<FplTeam['code'], FplTeam>;
    playerSelection: PlayerSelectionState;
    transferType: TransferType;
    ownedPlayersByCode: OwnedPlayersByCode;
    validationContext: Omit<TransferRuleContext, 'transfer'>;
    divisionsManagers: UserTeamsSheetData[];
    onPlayerOutChange: (playerOut: RosterPlayer | null) => void;
    onPlayerInChange: (playerIn: EnhancedPlayerData | null) => void;
}

function FirstSelector({
    availablePlayers,
    selectedManager,
    managerRoster,
    journeyPath,
    playersByCode,
    teamsByCode,
    playerSelection,
    transferType,
    ownedPlayersByCode,
    validationContext,
    divisionsManagers,
    onPlayerOutChange,
    onPlayerInChange,
}: SelectorStepProps) {
    if (!managerRoster) {
        return null;
    }

    if (journeyPath === JOURNEY_PATHS.teamFirst) {
        return (
            <PlayerOutSelector
                playersByCode={playersByCode}
                teamsByCode={teamsByCode}
                roster={managerRoster}
                selectedPlayer={playerSelection.playerOut}
                onPlayerChange={onPlayerOutChange}
                transferType={transferType}
                embeddedInJourney
            />
        );
    }

    return (
        <PlayerInSelector
            availablePlayers={availablePlayers}
            selectedPlayer={playerSelection.playerIn}
            onPlayerChange={onPlayerInChange}
            transferType={transferType}
            playerOut={playerSelection.playerOut}
            ownedPlayersByCode={ownedPlayersByCode}
            teamsByCode={teamsByCode}
            managerId={selectedManager}
            managers={divisionsManagers}
            validationContext={validationContext}
            embeddedInJourney
        />
    );
}

function SecondSelector({
    availablePlayers,
    selectedManager,
    managerRoster,
    journeyPath,
    playersByCode,
    teamsByCode,
    playerSelection,
    transferType,
    ownedPlayersByCode,
    validationContext,
    divisionsManagers,
    onPlayerOutChange,
    onPlayerInChange,
}: SelectorStepProps) {
    if (!managerRoster) {
        return null;
    }

    if (journeyPath === JOURNEY_PATHS.teamFirst) {
        return (
            <PlayerInSelector
                availablePlayers={availablePlayers}
                selectedPlayer={playerSelection.playerIn}
                onPlayerChange={onPlayerInChange}
                transferType={transferType}
                playerOut={playerSelection.playerOut}
                ownedPlayersByCode={ownedPlayersByCode}
                teamsByCode={teamsByCode}
                managerId={selectedManager}
                managers={divisionsManagers}
                validationContext={validationContext}
                embeddedInJourney
            />
        );
    }

    return (
        <PlayerOutSelector
            playersByCode={playersByCode}
            teamsByCode={teamsByCode}
            roster={managerRoster}
            selectedPlayer={playerSelection.playerOut}
            onPlayerChange={onPlayerOutChange}
            transferType={transferType}
            embeddedInJourney
        />
    );
}

interface SelectorReviewProps {
    transferType: TransferType;
    playerSelection: PlayerSelectionState;
    playersByCode: Record<number, EnhancedPlayerData>;
    teamsByCode: Record<FplTeam['code'], FplTeam>;
    comment: string;
    onCommentChange: (comment: string) => void;
    isLoanTransfer: boolean;
    currentManager?: UserTeamsSheetData;
    loanSelection: LoanSelectionState;
    divisionsManagers: UserTeamsSheetData[];
    selectedManager: ManagerId;
    onBorrowingManagerChange: (managerId: ManagerId) => void;
    isBeforeDeadline: boolean;
    validationContext: Omit<TransferRuleContext, 'transfer'>;
    canSubmit: boolean;
    isSubmitting: boolean;
}

function SelectorReview({
    transferType,
    playerSelection,
    playersByCode,
    teamsByCode,
    comment,
    onCommentChange,
    isLoanTransfer,
    currentManager,
    loanSelection,
    divisionsManagers,
    selectedManager,
    onBorrowingManagerChange,
    isBeforeDeadline,
    validationContext,
    canSubmit,
    isSubmitting,
}: SelectorReviewProps) {
    const playerOutFpl = playerSelection.playerOut ? playersByCode[playerSelection.playerOut.playerCode] : null;
    const playerIn = playerSelection.playerIn;

    const journeyIssues =
        playerSelection.playerOut && playerIn && playerOutFpl
            ? getTransferJourneyIssues({
                  validationContext,
                  transfer: {
                      playerOut: playerOutFpl,
                      playerIn,
                      managerId: selectedManager,
                      transferType,
                      gameweekData: validationContext.gameweekData,
                      id: 'review-journey-check',
                      timestamp: new Date(),
                      status: 'PENDING',
                      comment: 'Review journey check',
                      onLoanTo: undefined,
                      onLoanFrom: undefined,
                  },
                  managers: divisionsManagers,
                  managerId: selectedManager,
                  isBeforeDeadline,
                  includeGameweekLimit: true,
              })
            : [];

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
                    onChange={(e) => onCommentChange(e.target.value)}
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
                            handleUserChange={onBorrowingManagerChange}
                        />
                    }
                />
            ) : null}

            {journeyIssues.length > 0 ? (
                <div className={styles.validationErrors}>
                    {journeyIssues.map((issue, index) => (
                        <div
                            key={`${issue.icon}-${issue.text}-${index}`}
                            className={issue.severity === 'warning' ? styles.warningIssue : styles.blockingIssue}
                            title={issue.fullMessage}
                        >
                            {issue.icon} {issue.text}
                        </div>
                    ))}
                </div>
            ) : null}

            <div className={styles.section}>
                <button
                    type="submit"
                    disabled={canSubmit}
                    className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </>
    );
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

    const [step, setStep] = useState<JourneyStep>(JOURNEY_STEPS.firstSelector);
    const [transferType, setTransferType] = useState<TransferType>('TRANSFER');
    const [playerSelection, setPlayerSelection] = useState<PlayerSelectionState>(INITIAL_PLAYER_SELECTION);
    const [loanSelection, setLoanSelection] = useState<LoanSelectionState>(INITIAL_LOAN_SELECTION);
    const [comment, setComment] = useState('');
    const [validation, setValidation] = useState<TransferFormValidation>(INITIAL_VALIDATION);
    const stepContentRef = useRef<HTMLDivElement>(null);
    const journeyTitleRef = useRef<HTMLHeadingElement>(null);

    // Keep each step starting at the top after Continue/Back (window + step panel scroll;
    // also moves focus off the footer button so the browser does not keep it in view).
    useEffect(() => {
        window.scrollTo(0, 0);
        stepContentRef.current?.scrollTo(0, 0);
        journeyTitleRef.current?.focus({ preventScroll: true });
    }, [step]);

    const playersByCode: Record<number, EnhancedPlayerData> = Object.fromEntries(
        availablePlayers.map((player) => [player.code, player]),
    );
    const divisionsManagers = managers.filter((m) => m.divisionId === selectedDivision);
    const currentManager = divisionsManagers.find((m) => m.userId === selectedManager);
    const ownedPlayersByCode = Object.entries(divisionRosters).reduce((acc: OwnedPlayersByCode, [managerId, team]) => {
        (Object.keys(team.roster) as PositionSlotKey[]).forEach((slotKey) => {
            const slot = team.roster[slotKey];
            if (!slot) {
                return;
            }
            acc[slot.player.playerCode] = { managerId, slotKey, slot };
        });

        return acc;
    }, {});

    const clearForm = () => {
        setStep(JOURNEY_STEPS.firstSelector);
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
        setLoanSelection(
            getLoanSelectionForTransfer(transferType, nextPlayerSelection, ownedPlayersByCode, selectedManager),
        );
    };

    const handlePlayerInChange = (playerIn: EnhancedPlayerData | null) => {
        const nextPlayerSelection = {
            ...playerSelection,
            playerIn,
        };

        setPlayerSelection(nextPlayerSelection);
        setLoanSelection(
            getLoanSelectionForTransfer(transferType, nextPlayerSelection, ownedPlayersByCode, selectedManager),
        );
    };

    const handleTransferTypeChange = (nextTransferType: TransferType) => {
        setTransferType(nextTransferType);
        setLoanSelection(
            getLoanSelectionForTransfer(nextTransferType, playerSelection, ownedPlayersByCode, selectedManager),
        );
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
        if (step === JOURNEY_STEPS.firstSelector) {
            onExit();
            return;
        }
        if (step === JOURNEY_STEPS.secondSelector) {
            setStep(JOURNEY_STEPS.firstSelector);
            return;
        }
        setStep(JOURNEY_STEPS.secondSelector);
    };

    const goForward = () => {
        if (step === JOURNEY_STEPS.firstSelector) {
            setStep(JOURNEY_STEPS.secondSelector);
            return;
        }
        if (step === JOURNEY_STEPS.secondSelector) {
            setStep(JOURNEY_STEPS.review);
        }
    };

    const isLoanTransfer = transferType === 'LOAN_START' || transferType === 'LOAN_END';
    const canSubmit = fetcher.state === 'submitting' || !playerSelection.playerOut || !playerSelection.playerIn;
    const showContinue = step !== JOURNEY_STEPS.review && canContinue(step, journeyPath, playerSelection);
    const showTransferTypeSelector =
        step === JOURNEY_STEPS.firstSelector && canContinue(step, journeyPath, playerSelection);

    const gameweekLimitStatus = getGameweekLimitStatus(validationContext, selectedManager, transferType);

    return (
        <div className={styles.journey}>
            <ToastManager maxToasts={3} />
            <div className={styles.journeyHeader}>
                <button type="button" className={styles.backButton} onClick={goBack}>
                    ← {step === JOURNEY_STEPS.firstSelector ? 'Back to hub' : 'Back'}
                </button>
                <h2 className={styles.journeyTitle} ref={journeyTitleRef} tabIndex={-1}>
                    {STEP_TITLES[step][journeyPath]}
                </h2>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {step === JOURNEY_STEPS.firstSelector ? (
                    <div className={styles.stepContent} ref={stepContentRef}>
                        <FirstSelector
                            availablePlayers={availablePlayers}
                            selectedManager={selectedManager}
                            managerRoster={managerRoster}
                            journeyPath={journeyPath}
                            playersByCode={playersByCode}
                            teamsByCode={teamsByCode}
                            playerSelection={playerSelection}
                            transferType={transferType}
                            ownedPlayersByCode={ownedPlayersByCode}
                            validationContext={validationContext}
                            divisionsManagers={divisionsManagers}
                            onPlayerOutChange={handlePlayerOutChange}
                            onPlayerInChange={handlePlayerInChange}
                        />
                    </div>
                ) : null}
                {step === JOURNEY_STEPS.secondSelector ? (
                    <div className={styles.stepContent} ref={stepContentRef}>
                        <SecondSelector
                            availablePlayers={availablePlayers}
                            selectedManager={selectedManager}
                            managerRoster={managerRoster}
                            journeyPath={journeyPath}
                            playersByCode={playersByCode}
                            teamsByCode={teamsByCode}
                            playerSelection={playerSelection}
                            transferType={transferType}
                            ownedPlayersByCode={ownedPlayersByCode}
                            validationContext={validationContext}
                            divisionsManagers={divisionsManagers}
                            onPlayerOutChange={handlePlayerOutChange}
                            onPlayerInChange={handlePlayerInChange}
                        />
                    </div>
                ) : null}
                {step === JOURNEY_STEPS.review ? (
                    <div className={styles.stepContent} ref={stepContentRef}>
                        <SelectorReview
                            transferType={transferType}
                            playerSelection={playerSelection}
                            playersByCode={playersByCode}
                            teamsByCode={teamsByCode}
                            comment={comment}
                            onCommentChange={setComment}
                            isLoanTransfer={isLoanTransfer}
                            currentManager={currentManager}
                            loanSelection={loanSelection}
                            divisionsManagers={divisionsManagers}
                            selectedManager={selectedManager}
                            onBorrowingManagerChange={handleBorrowingManagerChange}
                            isBeforeDeadline={isBeforeDeadline}
                            validationContext={validationContext}
                            canSubmit={canSubmit}
                            isSubmitting={fetcher.state === 'submitting'}
                        />
                    </div>
                ) : null}

                {showContinue ? (
                    <div className={styles.journeyFooter}>
                        {/* displayText: short footer label; message (title): full validator copy */}
                        {gameweekLimitStatus ? (
                            <div className={styles.journeyWarning} title={gameweekLimitStatus.message}>
                                ⏱️ {gameweekLimitStatus.displayText}
                            </div>
                        ) : null}
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
