/* Location: app/admin/components/ui/nav-button.tsx */

import type React from 'react';
import styles from './nav-button.module.css';

interface NavPropsBase {
    active: boolean;
    icon: React.ReactNode;
    label: string;
}

interface NavLinkProps extends NavPropsBase {
    href: string;
}

interface NavButtonProps extends NavPropsBase {
    onClick: () => void;
}
type NavProps = NavLinkProps | NavButtonProps;

export const NavButton = (props: NavProps) => {
    const Tag = 'href' in props ? 'a' : 'button';
    const tagProps = 'href' in props ?
        { href: props.href } :
        { onClick: props.onClick }

    return (
        <Tag {...tagProps} className={`${styles.navButton} ${props.active ? styles.active : ''}`}>
            <span className={styles.navIcon}>{props.icon}</span>
            {props.label}
        </Tag>
    );
};
