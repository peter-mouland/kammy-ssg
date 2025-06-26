/* Location: app/admin/components/sections/transfers-section.tsx */

import { useState } from 'react';
import { useFetcher } from 'react-router';
import { Table, type TableColumn } from '../../../_shared/components/table';
import type { GameWeekData } from '../../../_shared/lib/fpl/fpl-types';
import type { DivisionId, DivisionSheetData } from '../../../teams/types/team-types';
import type { TransferAdminOverviewData, TransferValidationResult } from '../../../transfers/types/transfer-rule-types';
import type { ProcessedTransfer } from '../../../transfers/types/transfer-types';
import * as Icons from '../icons/admin-icons';
import { AdminContainer } from '../layout/admin-container';
import { AdminGrid } from '../layout/admin-grid';
import { AdminSection } from '../layout/admin-section';
import { ActionCard } from '../ui/action-card';
import { AdminMessage } from '../ui/admin-message';
import { StatusCard } from '../ui/status-card';
import styles from './transfers-section.module.css';

interface TransfersSectionProps {
    divisions: DivisionSheetData[];
    gameweek: GameWeekData;
    transfersData?: Record<DivisionId, TransferAdminOverviewData>;
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
                                {validation.warnings.map((warning, idx) => (
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

function GameweekTransfersSection({
    transfersData,
    gameweekInfo,
    onApprove,
    onReject,
}: {
    gameweekInfo: GameweekTransfersData;
    onApprove: (transferId: string) => void;
    onReject: (transferId: string) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    const columns: TableColumn<{ transfer: ProcessedTransfer; validation: TransferValidationResult }>[] = [
        {
            key: 'timestamp',
            header: 'Time',
            width: '120px',
            render: (_, item) => (
                <div className={styles.timestamp_cell}>
                    {item.transfer.timestamp.toLocaleDateString()}
                    <br />
                    <span className={styles.time_small}>
                        {item.transfer.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            width: '100px',
            render: (_, item) => <span className={styles.transfer_type_badge}>{item.transfer.transferType}</span>,
        },
        {
            key: 'playerOut',
            header: 'Player Out',
            width: '200px',
            render: (_, item) => (
                <div className={styles.player_cell}>
                    <div className={styles.player_name}>{item.transfer.playerOut.web_name}</div>
                    <div className={styles.player_details}>
                        <span className={styles.position}>{item.transfer.playerOut.draft.position}</span>
                        <span className={styles.team}>
                            {item.transfer.playerOut.team_name || `Team ${item.transfer.playerOut.team_code}`}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'playerIn',
            header: 'Player In',
            width: '200px',
            render: (_, item) => (
                <div className={styles.player_cell}>
                    <div className={styles.player_name}>{item.transfer.playerIn.web_name}</div>
                    <div className={styles.player_details}>
                        <span className={styles.position}>{item.transfer.playerIn.draft.position}</span>
                        <span className={styles.team}>
                            {item.transfer.playerIn.team_name || `Team ${item.transfer.playerIn.team_code}`}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'sheetStatus',
            header: 'Sheet Status',
            width: '120px',
            align: 'center',
            render: (_, item) => (
                <span className={`${styles.status_badge} ${styles[`status_${item.transfer.status.toLowerCase()}`]}`}>
                    {item.transfer.status}
                </span>
            ),
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
            render: (_, item) => (
                <div className={styles.action_buttons}>
                    <button
                        type="button"
                        onClick={() => onApprove(item.transfer.id)}
                        disabled={item.transfer.status !== 'PENDING'}
                        className={`${styles.action_btn} ${styles.approve_btn}`}
                        title="Approve Transfer"
                    >
                        <Icons.CheckIcon />
                    </button>
                    <button
                        type="button"
                        onClick={() => onReject(item.transfer.id)}
                        disabled={item.transfer.status !== 'PENDING'}
                        className={`${styles.action_btn} ${styles.reject_btn}`}
                        title="Reject Transfer"
                    >
                        <Icons.AlertIcon />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className={styles.gameweek_section}>
            <button type={'button'} className={styles.gameweek_header} onClick={() => setIsExpanded(!isExpanded)}>
                <div className={styles.gameweek_info}>
                    <div className={styles.gameweek_title}>
                        <span className={styles.gameweek_label}>Gameweek {gameweekInfo.gameweekData.fplEvent.id}</span>
                        <span className={styles.gameweek_dates}>
                            {gameweekInfo.gameweekData.start.toLocaleString('en-gb')} -{' '}
                            {gameweekInfo.gameweekData.end.toLocaleString('en-gb')}
                        </span>
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
                <div className={styles.expand_icon}>
                    -{/*<Icons.ChevronDownIcon className={isExpanded ? styles.expanded : ''} />*/}
                </div>
            </button>

            {isExpanded && (
                <div className={styles.gameweek_content}>
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
            )}
        </div>
    );
}

function DivisionTransfersPanel({
    divisionId,
    transfersData,
}: {
    divisionId: string;
    transfersData?: TransferAdminOverviewData;
}) {
    const fetcher = useFetcher();

    const handleApprove = (transferId: string) => {
        const formData = new FormData();
        formData.append('actionType', 'approveTransfer');
        formData.append('divisionId', divisionId);
        formData.append('transferId', transferId);
        formData.append('recommendation', 'APPROVE');

        fetcher.submit(formData, { method: 'POST' });
    };

    const handleReject = (transferId: string) => {
        const formData = new FormData();
        formData.append('actionType', 'rejectTransfer');
        formData.append('divisionId', divisionId);
        formData.append('transferId', transferId);
        formData.append('recommendation', 'REJECT');

        fetcher.submit(formData, { method: 'POST' });
    };

    if (!transfersData) {
        return <AdminMessage type="info">Loading transfers...</AdminMessage>;
    }

    // Group transfers by gameweek
    const transfersByGameweek = groupTransfersByGameweek(transfersData.transfers);

    return (
        <div className={styles.division_panel}>
            {transfersByGameweek.length === 0 ? (
                <AdminMessage type="info">No transfers found for this division</AdminMessage>
            ) : (
                <div className={styles.gameweeks_list}>
                    {transfersByGameweek.map((gameweekInfo) => (
                        <GameweekTransfersSection
                            key={gameweekInfo.gameweekData.fplEvent.id}
                            transfersData={transfersData}
                            gameweekInfo={gameweekInfo}
                            onApprove={handleApprove}
                            onReject={handleReject}
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

export function TransfersSection({ divisions, gameweek, transfersData }: TransfersSectionProps) {
    const [selectedDivision, setSelectedDivision] = useState<DivisionId>(
        divisions.length > 0 ? divisions[0].id : 'premierLeague',
    );
    const [showRuleConfig, setShowRuleConfig] = useState(false);
    const fetcher = useFetcher();

    const selectedDivisionData = transfersData?.[selectedDivision];

    const handleRefreshTransfers = (actionType: string) => {
        const formData = new FormData();
        formData.append('actionType', actionType);
        formData.append('divisionId', selectedDivision);

        fetcher.submit(formData, { method: 'POST' });
    };

    const handleValidateAllTransfers = (actionType: string) => {
        const formData = new FormData();
        formData.append('actionType', actionType);
        formData.append('divisionId', selectedDivision);

        fetcher.submit(formData, { method: 'POST' });
    };

    return (
        <AdminContainer>
            <AdminSection
                title="Transfer Management"
                icon={<Icons.SyncIcon />}
                description="Review and approve/reject transfers by gameweek"
            >
                {/* Division Selection */}
                <div className={styles.division_selector}>
                    <label htmlFor="division-select">Division:</label>
                    <select
                        id="division-select"
                        value={selectedDivision}
                        onChange={(e) => setSelectedDivision(e.target.value as DivisionId)}
                        className={styles.division_select}
                    >
                        {divisions.map((division) => (
                            <option key={division.id} value={division.id}>
                                {division.label} ({division.id})
                            </option>
                        ))}
                    </select>
                    GW: {gameweek?.fplEvent.id}
                </div>

                {/* Quick Actions */}
                <AdminGrid columns={'3'} gap="md">
                    <ActionCard
                        title="Refresh Transfers"
                        description="Reload transfer data from Google Sheets"
                        icon={<Icons.RefreshIcon />}
                        buttonText="Refresh Data"
                        actionType="refreshTransfers"
                        onExecute={handleRefreshTransfers}
                        fetcher={fetcher}
                    />

                    <ActionCard
                        title="Validate All"
                        description="Re-run validation rules on all pending transfers"
                        icon={<Icons.TargetIcon />}
                        buttonText="Validate All"
                        actionType="validateAllTransfers"
                        onExecute={handleValidateAllTransfers}
                        fetcher={fetcher}
                    />

                    <ActionCard
                        title="Configure Rules"
                        description="Manage transfer validation rules for this division"
                        icon={<Icons.SettingsIcon />}
                        buttonText="Configure Rules"
                        actionType="configureRules"
                        onExecute={() => setShowRuleConfig(true)}
                        fetcher={fetcher}
                    />
                </AdminGrid>

                {/* Error/Success Display */}
                {fetcher.data?.error && (
                    <AdminMessage type="error">{fetcher.data.error || 'Action Failed'}</AdminMessage>
                )}

                {fetcher.data?.success && (
                    <AdminMessage type="success">{fetcher.data.message || 'Action completed'}</AdminMessage>
                )}

                {/* Division Overview Stats */}
                {selectedDivisionData && (
                    <AdminGrid columns={'4'} gap="md">
                        <StatusCard
                            icon={selectedDivisionData.ruleStats.totalRules.toString()}
                            label="Total Rules"
                            percentage={`${selectedDivisionData.ruleStats.totalRules} rules`}
                            status="healthy"
                        />
                        <StatusCard
                            icon={selectedDivisionData.ruleStats.activeRules.toString()}
                            label="Active Rules"
                            percentage={`${selectedDivisionData.ruleStats.activeRules} active`}
                            status={selectedDivisionData.ruleStats.activeRules > 0 ? 'healthy' : 'warning'}
                        />
                        <StatusCard
                            icon={selectedDivisionData.statusStats.pendingCount.toString()}
                            label="Pending Transfers"
                            percentage={`${selectedDivisionData.statusStats.pendingCount} pending`}
                            status={selectedDivisionData.statusStats.pendingCount === 0 ? 'healthy' : 'warning'}
                        />
                        <StatusCard
                            icon={selectedDivisionData.validationStats.needsReview.toString()}
                            label="Need Review"
                            percentage={`${selectedDivisionData.validationStats.needsReview} for review`}
                            status={selectedDivisionData.validationStats.needsReview === 0 ? 'healthy' : 'warning'}
                        />
                    </AdminGrid>
                )}
            </AdminSection>

            {/* Transfers Panel */}
            {selectedDivision && (
                <AdminSection title={`Transfers for ${selectedDivision}`} collapsible expanded>
                    <DivisionTransfersPanel divisionId={selectedDivision} transfersData={selectedDivisionData} />
                </AdminSection>
            )}

            {/* Rule Configuration Modal/Panel */}
            {showRuleConfig && (
                <AdminSection
                    title="Transfer Rule Configuration"
                    collapsible
                    expanded={showRuleConfig}
                    onToggle={() => setShowRuleConfig(!showRuleConfig)}
                >
                    <AdminMessage type="info">
                        Rule configuration UI will be implemented in the next phase.
                    </AdminMessage>
                </AdminSection>
            )}
        </AdminContainer>
    );
}
