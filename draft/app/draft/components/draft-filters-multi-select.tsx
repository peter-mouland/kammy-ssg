// components/draft-filters-multi-select.tsx
import React, { useState, useRef, useEffect } from 'react';
import styles from './draft-filters-multi-select.module.css';

export interface MultiSelectOption {
    id: string;
    label: string;
    count: number;
    disabled?: boolean;
}

interface DraftFiltersMultiSelectProps {
    options: MultiSelectOption[];
    selectedValues: string[];
    onSelectionChange: (values: string[]) => void;
    placeholder: string;
    className?: string;
    sortOptions?: boolean;
}

export function DraftFiltersMultiSelect({
                                            options,
                                            selectedValues,
                                            onSelectionChange,
                                            placeholder,
                                            className,
                                            sortOptions = false
                                        }: DraftFiltersMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = (optionId: string) => {
        if (selectedValues.includes(optionId)) {
            onSelectionChange(selectedValues.filter(id => id !== optionId));
        } else {
            onSelectionChange([...selectedValues, optionId]);
        }
    };

    const getDisplayText = () => {
        const total = options.length;
        if (selectedValues.length === total) return `All ${placeholder}`;
        if (selectedValues.length === 0) return `No ${placeholder}`;
        if (selectedValues.length === 1) {
            const option = options.find(opt => opt.id === selectedValues[0]);
            return option?.label || `1 ${placeholder.slice(0, -1)}`;
        }
        return `${selectedValues.length} ${placeholder}`;
    };

    const sortedOptions = sortOptions
        ? [...options].sort((a, b) => a.label.localeCompare(b.label))
        : options;

    return (
        <div className={`${styles.dropdown} ${className || ''}`} ref={dropdownRef}>
            <button
                className={`${styles.dropdownButton} ${isOpen ? styles.open : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <span className={styles.dropdownText}>{getDisplayText()}</span>
                <span className={styles.dropdownArrow}>▼</span>
            </button>

            {isOpen && (
                <div className={styles.dropdownMenu}>
                    {sortedOptions.map(option => {
                        const isSelected = selectedValues.includes(option.id);
                        const isDisabled = option.disabled || option.count === 0;

                        const itemClass = `${styles.dropdownItem} ${
                            isSelected ? styles.selected : ''
                        } ${isDisabled ? styles.disabled : ''}`;

                        return (
                            <div
                                key={option.id}
                                className={itemClass}
                                onClick={() => !isDisabled && handleToggle(option.id)}
                            >
                                <div className={styles.checkbox}>
                                    {isSelected && <span className={styles.checkmark}>✓</span>}
                                </div>
                                <span className={styles.itemLabel}>{option.label}</span>
                                <span className={styles.itemCount}>{option.count}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
