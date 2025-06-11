// /admin/components/layout/nav-group.tsx
import React from 'react';
import styles from './nav-group.module.css';

interface NavGroupProps {
    children: React.ReactNode;
    direction?: 'vertical' | 'horizontal';
    gap?: 'sm' | 'md' | 'lg';
}

export const NavGroup = ({
                             children,
                             direction = 'vertical',
                             gap = 'md'
                         }: NavGroupProps) => {
    const directionClass = styles[`direction_${direction}`];
    const gapClass = styles[`gap_${gap}`];

    return (
        <nav className={`${styles.nav_group} ${directionClass} ${gapClass}`}>
            {children}
        </nav>
    );
};
