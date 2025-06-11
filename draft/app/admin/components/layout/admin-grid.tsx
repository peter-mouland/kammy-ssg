
// /admin/components/layout/admin-grid.tsx
import React from 'react';
import styles from './admin-grid.module.css';

interface AdminGridProps {
    children: React.ReactNode;
    columns?: 'auto' | '1' | '2' | '3' | '4';
    gap?: 'sm' | 'md' | 'lg';
    minWidth?: string;
}

export const AdminGrid = ({
                              children,
                              columns = 'auto',
                              gap = 'md',
                              minWidth = '250px'
                          }: AdminGridProps) => {
    const gridClass = columns === 'auto'
        ? styles.grid_auto
        : styles[`grid_${columns}`];

    const gapClass = styles[`gap_${gap}`];

    return (
        <div
            className={`${styles.grid} ${gridClass} ${gapClass}`}
            style={columns === 'auto' ? { '--min-width': minWidth } as any : undefined}
        >
            {children}
        </div>
    );
};
