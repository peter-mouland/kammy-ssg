// /admin/components/layout/admin-container.tsx
import React from 'react';
import styles from './admin-container.module.css';

interface AdminContainerProps {
    children: React.ReactNode;
    spacing?: 'sm' | 'md' | 'lg';
}

export const AdminContainer = ({ children, spacing = 'md' }: AdminContainerProps) => {
    return (
        <div className={`${styles.container} ${styles[`spacing_${spacing}`]}`}>
            {children}
        </div>
    );
};
