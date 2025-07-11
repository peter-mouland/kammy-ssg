/* Location: app/admin/components/ui/admin-button.tsx */

import type React from 'react';
import * as Icons from '../icons/admin-icons';
import styles from './admin-button.module.css';

interface AdminButtonProps {
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
    requireConfirm?: boolean;
    confirmMessage?: string;
    icon?: React.ReactNode;
    className?: string;
}

export function AdminButton({
    variant = 'primary',
    disabled = false,
    loading = false,
    onClick,
    children,
    requireConfirm = false,
    confirmMessage = 'Are you sure?',
    icon,
    className = '',
}: AdminButtonProps) {
    const isDisabled = disabled || loading;

    const handleClick = () => {
        if (isDisabled) return;

        if (requireConfirm) {
            const confirmed = window.confirm(confirmMessage);
            if (!confirmed) return;
        }

        onClick?.();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isDisabled}
            className={`${styles.actionButton} ${styles[variant]} ${isDisabled ? styles.disabled : ''} ${className}`}
        >
            {loading ? (
                <>
                    <Icons.RefreshIcon />
                    Loading...
                </>
            ) : (
                <>
                    {icon && icon}
                    {children}
                </>
            )}
        </button>
    );
}
