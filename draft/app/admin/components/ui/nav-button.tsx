import React from 'react';
import styles from './nav-button.module.css';

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

export const NavButton = ({ active, onClick, icon, label }: NavButtonProps) => {
    return (
        <button
            onClick={onClick}
            className={`${styles.navButton} ${active ? styles.active : ''}`}
        >
            <span className={styles.navIcon}>{icon}</span>
            {label}
        </button>
    );
};
