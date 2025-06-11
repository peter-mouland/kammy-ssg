import React from 'react';
import styles from './action-bar.module.css';

interface ActionBarProps {
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
    gap?: 'sm' | 'md' | 'lg';
}

export const ActionBar = ({
                              children,
                              align = 'left',
                              gap = 'md'
                          }: ActionBarProps) => {
    const alignClass = styles[`align_${align}`];
    const gapClass = styles[`gap_${gap}`];

    return (
        <div className={`${styles.action_bar} ${alignClass} ${gapClass}`}>
            {children}
        </div>
    );
};
