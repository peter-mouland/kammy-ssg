/* Location: app/transfers/components/transfer-type-selector.tsx */

import type { TransferType } from '../types/transfer-types';
import styles from './transfer-type-selector.module.css';

interface TransferTypeSelectorProps {
    selectedType: TransferType;
    onTypeChange: (type: TransferType) => void;
}

const TRANSFER_TYPES: Array<{
    value: TransferType;
    label: string;
    description: string;
}> = [
    {
        value: 'TRANSFER',
        label: 'Transfer',
        description: 'Standard player transfer',
    },
    {
        value: 'SWAP',
        label: 'Swap',
        description: 'Exchange players with another manager',
    },
    {
        value: 'LOAN_START',
        label: 'Loan Start',
        description: 'Loan a player from another manager',
    },
    {
        value: 'LOAN_FINISH',
        label: 'Loan End',
        description: 'Return a loaned player',
    },
    {
        value: 'TRADE',
        label: 'Trade',
        description: 'Multi-player trade with another manager',
    },
    {
        value: 'NEW_PLAYER',
        label: 'New Player',
        description: 'Add a new player to your squad',
    },
];

export function TransferTypeSelector({ selectedType, onTypeChange }: TransferTypeSelectorProps) {
    return (
        <div className={styles.transferTypeSelector}>
            <div className={styles.selectorHeader}>
                <h3 className={styles.selectorTitle}>Transfer Type</h3>
                <p className={styles.selectorDescription}>Select the type of transfer you want to make</p>
            </div>

            <div className={styles.typeOptions}>
                {TRANSFER_TYPES.map((type) => (
                    <label key={type.value} className={styles.typeOption}>
                        <input
                            type="radio"
                            name="transferType"
                            value={type.value}
                            checked={selectedType === type.value}
                            onChange={() => onTypeChange(type.value)}
                            className={styles.typeRadio}
                        />
                        <div className={styles.typeContent}>
                            <div className={styles.typeLabel}>{type.label}</div>
                            <div className={styles.typeDescription}>{type.description}</div>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}
