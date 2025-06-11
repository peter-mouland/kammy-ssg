// /admin/components/ui/refresh-button.tsx
import React from 'react';
import * as Icons from '../icons/admin-icons';
import styles from './refresh-button.module.css';

interface RefreshButtonProps {
    onClick?: () => void;
    loading?: boolean;
    children?: React.ReactNode;
}

export const RefreshButton = ({ onClick, loading = false, children }: RefreshButtonProps) => {
    return (
        <button
            className={styles.refresh_button}
            onClick={onClick}
            disabled={loading}
        >
            {loading ? (
                <span className={styles.spinner} />
            ) : (
                <Icons.RefreshIcon />
            )}
            {children || 'Refresh All'}
        </button>
    );
};
