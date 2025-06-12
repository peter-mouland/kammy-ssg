/* Location: app/admin/components/ui/admin-message.tsx */


// /admin/components/layout/admin-message.tsx
import React from 'react';
import styles from './admin-message.module.css';

interface AdminMessageProps {
    type: 'success' | 'error' | 'warning' | 'info';
    children: React.ReactNode;
    icon?: React.ReactNode;
}

export const AdminMessage = ({ type, children, icon }: AdminMessageProps) => {
    const defaultIcons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: '💡'
    };

    return (
        <div className={`${styles.message} ${styles[type]}`}>
            <span className={styles.icon}>
                {icon || defaultIcons[type]}
            </span>
            <div className={styles.content}>
                {children}
            </div>
        </div>
    );
};
