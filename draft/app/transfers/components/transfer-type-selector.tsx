/* Location: app/transfers/components/transfer-type-selector.tsx */

import { useEffect, useRef, useState } from 'react';
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
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedTypeData = TRANSFER_TYPES.find((type) => type.value === selectedType);

    const handleTypeSelect = (type: TransferType) => {
        onTypeChange(type);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (isOpen) {
                // Handle arrow navigation
                const currentIndex = TRANSFER_TYPES.findIndex((type) => type.value === selectedType);
                let newIndex;

                if (e.key === 'ArrowDown') {
                    newIndex = currentIndex < TRANSFER_TYPES.length - 1 ? currentIndex + 1 : 0;
                } else {
                    newIndex = currentIndex > 0 ? currentIndex - 1 : TRANSFER_TYPES.length - 1;
                }

                onTypeChange(TRANSFER_TYPES[newIndex].value);
            } else {
                setIsOpen(true);
            }
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={styles.dropdownContainer}>
            <button
                id="transfer-type-dropdown"
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className={`${styles.dropdownButton} ${isOpen ? styles.open : ''}`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className={styles.selectedContent}>
                    <div className={styles.selectedLabel}>{selectedTypeData?.label || 'Select Type'}</div>
                    <div className={styles.selectedDescription}>
                        {selectedTypeData?.description || 'Choose a transfer type'}
                    </div>
                </div>
                <div className={styles.dropdownArrow}>
                    <svg className={styles.arrowIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className={styles.dropdownMenu} role="listbox">
                    {TRANSFER_TYPES.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => handleTypeSelect(type.value)}
                            className={`
                                    ${styles.dropdownOption}
                                    ${type.value === selectedType ? styles.selected : ''}
                                `}
                            role="option"
                            aria-selected={type.value === selectedType}
                        >
                            <div className={styles.optionContent}>
                                <div className={styles.optionLabel}>
                                    {type.label}
                                    {type.value === selectedType && <span className={styles.selectedIcon}>✓</span>}
                                </div>
                                <div className={styles.optionDescription}>{type.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
