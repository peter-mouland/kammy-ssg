// app/_shared/components/toggle.tsx
import type React from 'react';
import styles from './toggle.module.css';

interface ToggleOption {
    value: string;
    label: string;
    icon: string;
    title?: string;
}

interface GenericToggleProps {
    options: ToggleOption[];
    activeValue: string;
    onToggle: (value: string) => void;
}

export const GenericToggle: React.FC<GenericToggleProps> = ({ options, activeValue, onToggle }) => {
    return (
        <div className={styles.toggleContainer}>
            <div className={styles.toggleTrack} data-active={activeValue}>
                {/* Sliding background indicator */}
                <div className={styles.toggleSlider} data-position={activeValue} />

                {options.map((option) => {
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onToggle(option.value)}
                            className={`${styles.toggleOption} ${activeValue === option.value ? styles.active : ''}`}
                            aria-pressed={activeValue === option.value}
                            title={option.title || `View ${option.label}`}
                        >
                            <span className={styles.toggleIcon}>{option.icon}</span>
                            <span className={styles.toggleLabel}>{option.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
