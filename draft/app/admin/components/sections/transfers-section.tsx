/* Location: app/admin/components/sections/transfers-section.tsx */

import type React from 'react';
import { useEffect, useState } from 'react';
import { useFetcher, useNavigate } from 'react-router';
import { GameweekSelector } from '../../../_shared/components/gameweek-selector';
import { SelectDivision } from '../../../_shared/components/select-division';
import { Table, type TableColumn } from '../../../_shared/components/table';
import type { FplTeam, GameWeekData } from '../../../_shared/lib/fpl/fpl-types';
import type { DivisionSheetData, ManagerId, PositionSlotKey } from '../../../_shared/types/league-types';
import { PlayerSummary } from '../../../players/components/player';
import type { RosterPlayer } from '../../../teams/types/team-types';
import { LoanStatusDisplay } from '../../../transfers/components/loan-status-display';
import type { TransferAdminOverviewData, TransferValidationResult } from '../../../transfers/types/transfer-rule-types';
import type { ProcessedTransfer } from '../../../transfers/types/transfer-types';
import type { AdminDataContext } from '../../types/admin-orchestrator-types';
import type { SystemStatusSummary } from '../../types/admin-types';
import * as Icons from '../icons/admin-icons';
import { ActionBar } from '../layout/action-bar';
import { AdminContainer } from '../layout/admin-container';
import { AdminSection } from '../layout/admin-section';
import { AdminMessage } from '../ui/admin-message';
import styles from './transfers-section.module.css';

interface TransfersSectionProps {
    divisions: DivisionSheetData[];
    transfersData?: Record<string, TransferAdminOverviewData>;
    systemStatus: SystemStatusSummary;
    sharedContext: AdminDataContext;
    selectedDivision: DivisionSheetData;
    selectedGameweek: GameWeekData;
    teamsByCode: Record<number, FplTeam> | null;
}

interface GameweekTransfersData {
    gameweekData: GameWeekData;
    transfers: Array<{
        transfer: ProcessedTransfer;
        validation: TransferValidationResult;
    }>;
    summary: {
        approve: number;
        reject: number;
        pending: number;
        needsReview: number;
    };
}

interface RecommendationTooltipProps {
    validation: TransferValidationResult;
    children: React.ReactNode;
}

function RecommendationTooltip({ validation, children }: RecommendationTooltipProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div
            className={styles.tooltip_container}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {children}
            {showTooltip && (
                <div className={styles.tooltip}>
                    <div className={styles.tooltip_summary}>{validation.summary}</div>

                    {validation.blockingFailures.length > 0 && (
                        <div className={styles.tooltip_section}>
                            <strong>Blocking Issues:</strong>
                            <ul>
                                {validation.blockingFailures.map((failure, idx) => (
                                    <li key={idx}>{failure.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {validation.warnings.length > 0 && (
                        <div className={styles.tooltip_section}>
                            <strong>Warnings:</strong>
                            <ul>
                                {validation.warnings.map((warning, _idx) => (
                                    <li key={warning.message}>{warning.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function getTransferTypeIcon(transferType: string): string {
    switch (transferType) {
        case 'TRANSFER':
            return '🔄';
        case 'SWAP':
            return '🔀';
        case 'LOAN_START':
            return '📤';
        case 'LOAN_END':
            return '📥';
        case 'TRADE':
            return '🤝';
        case 'NEW_PLAYER':
            return '✨';
        default:
            return '📋';
    }
}

function GameweekTransfersSection({
    teamsByCode,
    selectedDivision,
    gameweekInfo,
    onApprove,
    onReject,
    isLoading,
    successfulActions,
}: {
    teamsByCode: Record<number, FplTeam> | null;
    selectedDivision: DivisionSheetData;
    gameweekInfo: GameweekTransfersData;
    onApprove: (transferId: string) => void;
    onReject: (transferId: string) => void;
    isLoading: boolean;
    successfulActions: Set<string>;
}) {
    const columns: TableColumn<{ transfer: ProcessedTransfer; validation: TransferValidationResult }>[] = [
        {
            key: 'timestamp',
            header: 'Time',
            width: '120px',
            render: (_, item) => (
                <div className={styles.timestamp_cell}>
                    {item.transfer.timestamp.toLocaleDateString('en-gb')}
                    <br />
                    <span className={styles.time_small}>
                        {item.transfer.timestamp.toLocaleTimeString(['en-gb'], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            width: '100px',

            render: (_, item) => (
                <span className={`${styles.transfer_type_badge} ${item.transfer.transferType}`}>
                    {getTransferTypeIcon(item.transfer.transferType)}
                    <span style={{ padding: '0.25em' }} />
                    {item.transfer.transferType}
                </span>
            ),
        },
        {
            key: 'manager',
            header: 'User',
            width: '100px',
            render: (_, item) => item.transfer.managerId,
        },
        {
            key: 'playerOut',
            header: 'Player Out',
            width: '200px',
            render: (_, item) => {
                return (
                    <PlayerSummary
                        player={item.transfer.playerOut}
                        teamsByCode={teamsByCode}
                        onLoanTo={item.transfer.onLoanTo}
                    />
                );
            },
        },
        {
            key: 'playerIn',
            header: 'Player In',
            width: '200px',
            render: (_, item) => {
                return (
                    <PlayerSummary
                        player={item.transfer.playerIn}
                        teamsByCode={teamsByCode}
                        onLoanFrom={item.transfer.onLoanFrom}
                    />
                );
            },
        },
        {
            key: 'comment',
            header: 'Comments',
            width: '120px',
            align: 'center',
            render: (_, item) => <span>{item.transfer.comment}</span>,
        },
        {
            key: 'recommendation',
            header: 'Recommendation',
            width: '140px',
            align: 'center',
            render: (_, item) => (
                <RecommendationTooltip validation={item.validation}>
                    <span
                        className={`${styles.recommendation_badge} ${styles[`rec_${item.validation.recommendation.toLowerCase()}`]}`}
                    >
                        {item.validation.recommendation}
                    </span>
                </RecommendationTooltip>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            width: '140px',
            align: 'center',
            render: (_, item) => {
                const wasApproved = successfulActions.has(`approve_${item.transfer.id}`);
                const wasRejected = successfulActions.has(`reject_${item.transfer.id}`);
                const isPending = item.transfer.status === 'PENDING' && !wasApproved && !wasRejected;

                return (
                    <div className={styles.action_buttons}>
                        {isPending ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onApprove(item.transfer.id)}
                                    disabled={isLoading}
                                    className={`${styles.action_btn} ${styles.approve_btn}`}
                                    title="Approve Transfer"
                                >
                                    {isLoading ? <div className={styles.loading_spinner} /> : <Icons.CheckIcon />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onReject(item.transfer.id)}
                                    disabled={isLoading}
                                    className={`${styles.action_btn} ${styles.reject_btn}`}
                                    title="Reject Transfer"
                                >
                                    {isLoading ? <div className={styles.loading_spinner} /> : <Icons.AlertIcon />}
                                </button>
                            </>
                        ) : (
                            <div className={styles.action_status}>
                                {wasApproved && <span className={styles.status_text_approved}>✅ Approved</span>}
                                {wasRejected && <span className={styles.status_text_rejected}>❌ Rejected</span>}
                                {!wasApproved && !wasRejected && item.transfer.status === 'APPROVED' && (
                                    <span className={styles.status_text_approved}>✅ Approved</span>
                                )}
                                {!wasApproved && !wasRejected && item.transfer.status === 'REJECTED' && (
                                    <span className={styles.status_text_rejected}>❌ Rejected</span>
                                )}
                            </div>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div>
            <div className={styles.gameweek_info}>
                <div className={styles.gameweek_title}>
                    <div className={styles.gameweek_label}>
                        {selectedDivision.label} Gameweek {gameweekInfo.gameweekData.fplEvent.id}
                    </div>
                    <div className={styles.gameweek_dates}>
                        {gameweekInfo.gameweekData.start.toLocaleString('en-gb')} -{' '}
                        {gameweekInfo.gameweekData.end.toLocaleString('en-gb')}
                    </div>
                </div>
                <div className={styles.gameweek_stats}>
                    <span className={`${styles.stat_badge} ${styles.approved}`}>
                        {gameweekInfo.summary.approve} approve
                    </span>
                    <span className={`${styles.stat_badge} ${styles.rejected}`}>
                        {gameweekInfo.summary.reject} reject
                    </span>
                    <span className={`${styles.stat_badge} ${styles.pending}`}>
                        {gameweekInfo.summary.pending} pending
                    </span>
                    <span className={`${styles.stat_badge} ${styles.review}`}>
                        {gameweekInfo.summary.needsReview} need review
                    </span>
                </div>
            </div>

            <div style={{ marginTop: '2em' }}>
                {gameweekInfo.transfers.length === 0 ? (
                    <AdminMessage type="info">No transfers for this gameweek</AdminMessage>
                ) : (
                    <Table
                        data={gameweekInfo.transfers}
                        columns={columns}
                        size="compact"
                        bordered={true}
                        sortable={true}
                        defaultSort={{ key: 'timestamp', direction: 'desc' }}
                    />
                )}
            </div>
        </div>
    );
}

function DivisionTransfersPanel({
    selectedDivision,
    transfersData,
    teamsByCode,
}: {
    selectedDivision: DivisionSheetData;
    transfersData?: TransferAdminOverviewData;
    teamsByCode: Record<number, FplTeam> | null;
}) {
    const fetcher = useFetcher();
    const [successfulActions, setSuccessfulActions] = useState<Set<string>>(new Set());

    // Track successful actions and update UI state
    useEffect(() => {
        if (fetcher.data?.success && fetcher.data?.data?.transferId) {
            const transferId = fetcher.data.data.transferId;
            const recommendation = fetcher.data.data.recommendation;
            const actionKey = `${recommendation.toLowerCase()}_${transferId}`;

            setSuccessfulActions((prev) => new Set([...prev, actionKey]));
        }
    }, [fetcher.data]);

    // Clear successful actions when data changes (e.g., page refresh)
    useEffect(() => {
        setSuccessfulActions(new Set());
    }, [transfersData]);

    const handleApprove = (transferId: string) => {
        const formData = new FormData();
        formData.append('actionType', 'approveTransfer');
        formData.append('divisionId', selectedDivision.id);
        formData.append('transferId', transferId);
        formData.append('recommendation', 'APPROVE');

        fetcher.submit(formData, {
            method: 'POST',
            action: '/admin', // Submit to parent route
        });
    };

    const handleReject = (transferId: string) => {
        const formData = new FormData();
        formData.append('actionType', 'rejectTransfer');
        formData.append('divisionId', selectedDivision.id);
        formData.append('transferId', transferId);
        formData.append('recommendation', 'REJECT');

        fetcher.submit(formData, {
            method: 'POST',
            action: '/admin', // Submit to parent route
        });
    };

    const isLoading = fetcher.state === 'submitting';

    if (!transfersData) {
        return <AdminMessage type="info">Loading transfers...</AdminMessage>;
    }

    // Group transfers by gameweek
    const transfersByGameweek = groupTransfersByGameweek(transfersData.transfers);

    return (
        <div className={styles.division_panel}>
            {/* Success/Error Messages */}
            {fetcher.data?.success && <AdminMessage type="success">{fetcher.data.message}</AdminMessage>}
            {fetcher.data?.error && <AdminMessage type="error">{fetcher.data.error}</AdminMessage>}

            {transfersByGameweek.length === 0 ? (
                <AdminMessage type="info">No transfers found for this division</AdminMessage>
            ) : (
                <div className={styles.gameweeks_list}>
                    {transfersByGameweek.map((gameweekInfo) => (
                        <GameweekTransfersSection
                            key={gameweekInfo.gameweekData.fplEvent.id}
                            gameweekInfo={gameweekInfo}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            selectedDivision={selectedDivision}
                            teamsByCode={teamsByCode}
                            isLoading={isLoading}
                            successfulActions={successfulActions}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function groupTransfersByGameweek(
    transfers: Array<{ transfer: ProcessedTransfer; validation: TransferValidationResult }>,
): GameweekTransfersData[] {
    const gameweekMap = new Map<number, GameweekTransfersData>();

    transfers.forEach(({ transfer, validation }) => {
        const gameweek = transfer.gameweekData.fplEvent.id;

        if (!gameweekMap.has(gameweek)) {
            gameweekMap.set(gameweek, {
                gameweekData: transfer.gameweekData,
                transfers: [],
                summary: { approve: 0, reject: 0, pending: 0, needsReview: 0 },
            });
        }

        const gameweekData = gameweekMap.get(gameweek)!;
        gameweekData.transfers.push({ transfer, validation });

        // Update summary
        switch (validation.recommendation) {
            case 'APPROVE':
                gameweekData.summary.approve++;
                break;
            case 'REJECT':
                gameweekData.summary.reject++;
                break;
            case 'REVIEW':
                gameweekData.summary.needsReview++;
                break;
        }

        if (transfer.status === 'PENDING') {
            gameweekData.summary.pending++;
        }
    });

    return Array.from(gameweekMap.values()).sort((a, b) => (b.gameweekData.start > a.gameweekData.start ? 1 : -1));
}

type ActiveLoan = {
    player: RosterPlayer;
    to: ManagerId | null;
    from: ManagerId | null;
};

export function TransfersSection({
    divisions,
    selectedDivision,
    selectedGameweek,
    transfersData,
    systemStatus,
    teamsByCode,
    sharedContext,
}: TransfersSectionProps) {
    const divisionTransferData = transfersData[selectedDivision.id];
    const navigate = useNavigate();

    const availableGameweeks = Array.from({ length: systemStatus.currentGameweek.fplEvent.id }, (_, i) => i + 1);
    const selectedDivisionData = transfersData?.[selectedDivision.id];
    const handleDivisionChange = (divisionId: string) => {
        if (divisionId !== 'all') {
            navigate(`/admin/transfers/?division=${divisionId}&gameweek=${selectedGameweek.fplEvent.id}`);
        } else {
            navigate(`/admin/transfers?gameweek=${selectedGameweek.fplEvent.id}`);
        }
    };

    const loans: Record<RosterPlayer['playerCode'], ActiveLoan> = {};
    Object.keys(divisionTransferData.divisionRosters).forEach((managerId) => {
        const { roster } = divisionTransferData.divisionRosters[managerId];
        Object.keys(roster).forEach((slotKey) => {
            const player = roster[slotKey as PositionSlotKey].player;
            if (player.onLoanTo || player.onLoanFrom) {
                loans[player.playerCode] = {
                    player,
                    to: loans[player.playerCode]?.to || player.onLoanTo,
                    from: loans[player.playerCode]?.from || player.onLoanFrom,
                };
            }
        });
    });

    return (
        <AdminContainer>
            <AdminSection
                title="Transfer Management"
                icon={<Icons.SyncIcon />}
                description="Review and approve/reject transfers by gameweek"
                actions={
                    <ActionBar align={'right'} gap={'md'}>
                        <GameweekSelector
                            currentGameweekData={systemStatus.currentGameweek}
                            selectedGameweekData={selectedGameweek}
                            availableGameweeks={availableGameweeks}
                        />
                        <SelectDivision
                            divisions={divisions}
                            selectedDivision={selectedDivision.id}
                            handleDivisionChange={handleDivisionChange}
                        />
                    </ActionBar>
                }
            >
                <DivisionTransfersPanel
                    selectedDivision={selectedDivision}
                    transfersData={selectedDivisionData}
                    teamsByCode={teamsByCode}
                />
                <LoanStatusDisplay
                    teamsByCode={teamsByCode}
                    fplPlayersByCode={divisionTransferData.validationContext.fplPlayersByCode}
                    loans={loans}
                    managers={sharedContext.sheetData.managers}
                    currentManagerId={''}
                />
            </AdminSection>
        </AdminContainer>
    );
}
