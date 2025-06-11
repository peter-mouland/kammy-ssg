// /admin/components/layout/app-shell.tsx
import React from 'react';
import styles from './app-shell.module.css';

interface AppShellProps {
    children: React.ReactNode;
    background?: 'light' | 'dark' | 'gray';
}

export const AppShell = ({ children, background = 'gray' }: AppShellProps) => {
    return (
        <div className={`${styles.shell} ${styles[`bg_${background}`]}`}>
            {children}
        </div>
    );
};
