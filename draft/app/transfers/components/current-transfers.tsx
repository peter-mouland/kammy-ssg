/* Location: app/transfers/components/current-transfers.tsx */

import { Table, type TableColumn } from '../../_shared/components/table';
import type { DivisionId } from '../../teams/types/team-types';
import type { TransferRecommendation, TransferValidationResult } from '../types/transfer-rule-types';
import type { ProcessedTransfer } from '../types/transfer-types';
import styles from './current-transfers.module.css';

interface CurrentTransfersProps {
    transfers: Array<{
        transfer: ProcessedTransfer;
        validation: TransferValidationResult;
        recommendation: TransferRecommendation;
    }>;
    currentGameweek: number;
    availableGameweeks: number[];
    selectedGameweek: number;
    selectedDivision: DivisionId;
}

export function CurrentTransfers({
    transfers,
    currentGameweek,
    selectedGameweek,
    selectedDivision,
}: CurrentTransfersProps) {
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
    ];

    return (
        <div className={styles.currentTransfers}>
            {/* Header with Gameweek Selector */}
            <div className={styles.transfersHeader}>
                <div className={styles.headerInfo}>
                    <h3 className={styles.headerTitle}>Transfers for {selectedDivision}</h3>
                    <p className={styles.headerDescription}>
                        {transfers.length} transfer{transfers.length !== 1 ? 's' : ''} found
                    </p>
                </div>
            </div>

            {/* Transfers List */}
            <div className={styles.transfersList}>
                {transfers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <h4 className={styles.emptyTitle}>No Transfers Found</h4>
                        <p className={styles.emptyMessage}>
                            {selectedGameweek === currentGameweek
                                ? 'No transfers have been submitted for the current gameweek yet.'
                                : `No transfers were submitted for gameweek ${selectedGameweek}.`}
                        </p>
                    </div>
                ) : (
                    <Table
                        data={transfers}
                        columns={columns}
                        size="compact"
                        bordered={true}
                        sortable={true}
                        defaultSort={{ key: 'timestamp', direction: 'desc' }}
                    />
                )}
            </div>

            {/* Summary Stats */}
            {transfers.length > 0 && (
                <div className={styles.transfersSummary}>
                    <div className={styles.summaryStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>
                                {transfers.filter((t) => t.transfer.status === 'PENDING').length}
                            </span>
                            <span className={styles.statLabel}>Pending</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>
                                {transfers.filter((t) => t.transfer.status === 'APPROVED').length}
                            </span>
                            <span className={styles.statLabel}>Approved</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>
                                {transfers.filter((t) => t.transfer.status === 'REJECTED').length}
                            </span>
                            <span className={styles.statLabel}>Rejected</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
