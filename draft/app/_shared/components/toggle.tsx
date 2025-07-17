// app/_shared/components/toggle.tsx
import type React from 'react';
import styles from './toggle.module.css';

export interface ToggleOption {
    value: string;
    label: string;
    icon: string;
    title?: string;
}

export interface GenericToggleProps {
    options: [ToggleOption, ToggleOption]; // Exactly 2 options for this toggle design
    activeValue: string;
    onToggle: (value: string) => void;
}

export const GenericToggle: React.FC<GenericToggleProps> = ({ options, activeValue, onToggle }) => {
    const [firstOption, secondOption] = options;

    return (
        <div className={styles.toggleContainer}>
            <div className={styles.toggleTrack} data-active={activeValue}>
                {/* Sliding background indicator */}
                <div className={styles.toggleSlider} data-position={activeValue} />

                {/* Toggle buttons */}
                <button
                    type="button"
                    onClick={() => onToggle(firstOption.value)}
                    className={`${styles.toggleOption} ${activeValue === firstOption.value ? styles.active : ''}`}
                    aria-pressed={activeValue === firstOption.value}
                    title={firstOption.title || `View ${firstOption.label}`}
                >
                    <span className={styles.toggleIcon}>{firstOption.icon}</span>
                    <span className={styles.toggleLabel}>{firstOption.label}</span>
                </button>

                <button
                    type="button"
                    onClick={() => onToggle(secondOption.value)}
                    className={`${styles.toggleOption} ${activeValue === secondOption.value ? styles.active : ''}`}
                    aria-pressed={activeValue === secondOption.value}
                    title={secondOption.title || `View ${secondOption.label}`}
                >
                    <span className={styles.toggleIcon}>{secondOption.icon}</span>
                    <span className={styles.toggleLabel}>{secondOption.label}</span>
                </button>
            </div>
        </div>
    );
};
