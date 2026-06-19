/* Location: app/transfers/components/current-transfers.tsx */

import { Table, type TableColumn } from '../../_shared/components/table';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { PlayerSummary } from '../../players/components/player';
import type { DivisionId } from '../../teams/types/team-types';
import type { TransferRecommendation, TransferValidationResult } from '../types/transfer-rule-types';
import type { ProcessedTransfer } from '../types/transfer-types';
import styles from './current-transfers.module.css';

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
    teamsByCode: Record<number, FplTeam>;
}

export function CurrentTransfers({
    teamsByCode,
    transfers,
    currentGameweek,
    selectedGameweek,
    selectedDivision,
}: CurrentTransfersProps) {
    const columns: TableColumn<{ transfer: ProcessedTransfer; validation: TransferValidationResult }>[] = [
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
                return <PlayerSummary player={item.transfer.playerOut} teamsByCode={teamsByCode} />;
            },
        },
        {
            key: 'playerIn',
            header: 'Player In',
            width: '200px',
            render: (_, item) => {
                return <PlayerSummary player={item.transfer.playerIn} teamsByCode={teamsByCode} />;
            },
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
            key: 'comment',
            header: 'Comments',
            width: '120px',
            align: 'center',
            render: (_, item) => <span>{item.transfer.comment}</span>,
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
        </div>
    );
}
