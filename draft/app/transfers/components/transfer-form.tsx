/* Location: app/transfers/components/transfer-form.tsx */

import { useEffect, useState } from 'react';
import { useFetcher, useSearchParams } from 'react-router';
import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type {
    DivisionId,
    DivisionSheetData,
    ManagerId,
    TeamRoster,
    UserTeamsSheetData,
} from '../../teams/types/team-types';
import type { PlayerSelectionState, TransferValidationResult } from '../types/transfer-form-types';
import type { TransferType } from '../types/transfer-types';
import { PlayerInSelector } from './player-in-selector';
import { PlayerOutSelector } from './player-out-selector';
import { TransferTypeSelector } from './tramsfer-type-selector';
import styles from './transfer-form.module.css';

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
}

export function TransferForm({
    managers,
    selectedDivision,
    selectedManager,
    managerRoster,
    availablePlayers,
    isBeforeDeadline,
}: TransferFormProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const fetcher = useFetcher();

    const [playerSelection, setPlayerSelection] = useState<PlayerSelectionState>({
        playerOut: null,
        playerIn: null,
        transferType: 'TRANSFER',
    });

    const [comment, setComment] = useState('');
    const [validation, setValidation] = useState<TransferValidationResult>({
        isValid: false,
        warnings: [],
        errors: [],
        blockingIssues: [],
    });

    // Get managers for selected division
    const divisionsManagers = managers.filter((m) => m.divisionId === selectedDivision);

    const handleManagerChange = (managerId: ManagerId) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('manager', managerId);
        setSearchParams(newParams);

        // Reset player selection when manager changes
        setPlayerSelection({
            playerOut: null,
            playerIn: null,
            transferType: playerSelection.transferType,
        });
    };

    const handlePlayerOutChange = (player: EnhancedPlayerData | null) => {
        setPlayerSelection((prev) => ({
            ...prev,
            playerOut: player,
        }));
    };

    const handlePlayerInChange = (player: EnhancedPlayerData | null) => {
        setPlayerSelection((prev) => ({
            ...prev,
            playerIn: player,
        }));
    };

    const handleTransferTypeChange = (transferType: TransferType) => {
        setPlayerSelection((prev) => ({
            ...prev,
            transferType,
        }));
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
        formData.append('transferType', playerSelection.transferType);
        formData.append('playerOutCode', playerSelection.playerOut?.playerCode.toString() || '');
        formData.append('playerInCode', playerSelection.playerIn?.code.toString() || '');
        formData.append('comment', comment);

        fetcher.submit(formData, { method: 'POST' });
    };

    // Validate transfer when selection changes
    useEffect(() => {
        if (playerSelection.playerOut && playerSelection.playerIn) {
            // TODO: Integrate with existing validation rules
            setValidation({
                isValid: true,
                warnings: [],
                errors: [],
                blockingIssues: [],
            });
        } else {
            setValidation({
                isValid: false,
                warnings: [],
                errors: [],
                blockingIssues: ['Please select both players'],
            });
        }
    }, [playerSelection]);

    const canSubmit =
        isBeforeDeadline &&
        selectedDivision &&
        selectedManager &&
        validation.isValid &&
        validation.blockingIssues.length === 0;

    return (
        <form onSubmit={handleSubmit} className={styles.transferForm}>
            <div className={styles.selectionRow}>
                <div className={styles.fieldGroup}>
                    <label htmlFor="manager-select" className={styles.fieldLabel}>
                        Manager
                    </label>
                    <select
                        id="manager-select"
                        value={selectedManager}
                        onChange={(e) => handleManagerChange(e.target.value as ManagerId)}
                        className={styles.selectInput}
                        disabled={!selectedDivision}
                    >
                        <option value="">Select Manager</option>
                        {divisionsManagers.map((manager) => (
                            <option key={manager.userId} value={manager.userId}>
                                {manager.userId}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Transfer Type Selection */}
            {selectedManager && (
                <div className={styles.transferTypeSection}>
                    <TransferTypeSelector
                        selectedType={playerSelection.transferType}
                        onTypeChange={handleTransferTypeChange}
                    />
                </div>
            )}

            {/* Player Selection */}
            {selectedManager && managerRoster && (
                <div className={styles.playerSelectionSection}>
                    <div className={styles.playerSelectors}>
                        <div className={styles.playerOutSection}>
                            <PlayerOutSelector
                                roster={managerRoster}
                                selectedPlayer={playerSelection.playerOut}
                                onPlayerChange={handlePlayerOutChange}
                                transferType={playerSelection.transferType}
                            />
                        </div>

                        <div className={styles.transferArrow}>
                            <span className={styles.arrowIcon}>→</span>
                        </div>

                        <div className={styles.playerInSection}>
                            <PlayerInSelector
                                availablePlayers={availablePlayers}
                                selectedPlayer={playerSelection.playerIn}
                                onPlayerChange={handlePlayerInChange}
                                transferType={playerSelection.transferType}
                                playerOut={playerSelection.playerOut}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Comment Section */}
            {selectedManager && (
                <div className={styles.commentSection}>
                    <label htmlFor="comment" className={styles.fieldLabel}>
                        Comment (Optional)
                    </label>
                    <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className={styles.commentInput}
                        placeholder="Add any additional notes about this transfer..."
                        rows={3}
                    />
                </div>
            )}

            {/* Validation Messages */}
            {validation.warnings.length > 0 && (
                <div className={styles.validationWarnings}>
                    {validation.warnings.map((warning, index) => (
                        <div key={index} className={styles.warningMessage}>
                            ⚠️ {warning}
                        </div>
                    ))}
                </div>
            )}

            {validation.blockingIssues.length > 0 && (
                <div className={styles.validationErrors}>
                    {validation.blockingIssues.map((error, index) => (
                        <div key={index} className={styles.errorMessage}>
                            ❌ {error}
                        </div>
                    ))}
                </div>
            )}

            {/* Submit Button */}
            <div className={styles.submitSection}>
                <button
                    type="submit"
                    disabled={!canSubmit || fetcher.state === 'submitting'}
                    className={styles.submitButton}
                >
                    {fetcher.state === 'submitting' ? 'Submitting...' : 'Submit Transfer'}
                </button>

                {!isBeforeDeadline && (
                    <p className={styles.deadlineMessage}>Transfer deadline has passed for this gameweek</p>
                )}
            </div>

            {/* Action Results */}
            {fetcher.data?.success && (
                <div className={styles.successMessage}>
                    ✅ {fetcher.data.message || 'Transfer submitted successfully!'}
                </div>
            )}

            {fetcher.data?.error && <div className={styles.errorMessage}>❌ {fetcher.data.error}</div>}
        </form>
    );
}
