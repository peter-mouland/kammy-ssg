/* Location: app/_shared/components/search-input.tsx */

import styles from './search-input.module.css';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function SearchInput({
    value,
    onChange,
    placeholder = 'Search...',
    className,
    disabled = false,
}: SearchInputProps) {
    return (
        <div className={`${styles.searchContainer} ${className || ''}`}>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={styles.searchInput}
                disabled={disabled}
            />
            <div className={styles.searchIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
            </div>
        </div>
    );
}
