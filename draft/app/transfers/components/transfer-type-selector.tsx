/* Location: app/transfers/components/transfer-type-selector.tsx */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
        description: 'Exchange players within your team',
    },
    {
        value: 'LOAN_START',
        label: 'Loan Start',
        description: 'Loan a player from another manager',
    },
    {
        value: 'LOAN_END',
        label: 'Loan End',
        description: 'Return a loaned player',
    },
    {
        value: 'TRADE',
        label: 'Trade',
        description: 'A permanent player trade with another manager',
    },
    {
        value: 'NEW_PLAYER',
        label: 'New Player Request',
        description: 'Enter a draw for a "New Player"',
    },
];

const MENU_MAX_HEIGHT_PX = 300;
const VIEWPORT_EDGE_GAP_PX = 8;

export function TransferTypeSelector({ selectedType, onTypeChange }: TransferTypeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [opensUpward, setOpensUpward] = useState(false);
    const [menuMaxHeight, setMenuMaxHeight] = useState(MENU_MAX_HEIGHT_PX);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const selectedTypeData = TRANSFER_TYPES.find((type) => type.value === selectedType);

    const updateMenuPlacement = () => {
        const button = buttonRef.current;
        if (!button) {
            return;
        }

        const rect = button.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_EDGE_GAP_PX;
        const spaceAbove = rect.top - VIEWPORT_EDGE_GAP_PX;
        const shouldOpenUpward = spaceBelow < MENU_MAX_HEIGHT_PX && spaceAbove > spaceBelow;
        const availableSpace = shouldOpenUpward ? spaceAbove : spaceBelow;

        setOpensUpward(shouldOpenUpward);
        setMenuMaxHeight(Math.max(120, Math.min(MENU_MAX_HEIGHT_PX, availableSpace)));
    };

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

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }

        updateMenuPlacement();
    }, [isOpen]);

    // Close dropdown when clicking outside; keep placement valid on resize/scroll
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleReposition = () => {
            updateMenuPlacement();
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
        };
    }, [isOpen]);

    return (
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
                id="transfer-type-dropdown"
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className={`${styles.dropdownButton} ${isOpen ? styles.open : ''} ${
                    isOpen && opensUpward ? styles.openUpward : ''
                }`}
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
                <div
                    className={`${styles.dropdownMenu} ${opensUpward ? styles.dropdownMenuUpward : ''}`}
                    role="listbox"
                    style={{ maxHeight: `${menuMaxHeight}px` }}
                >
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
