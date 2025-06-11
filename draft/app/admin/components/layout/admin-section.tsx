import React from 'react';
import styles from './admin-section.module.css';

interface AdminSectionProps {
    title: string;
    icon?: React.ReactNode;
    description?: string;
    children?: React.ReactNode;
    actions?: React.ReactNode;
    collapsible?: boolean;
    expanded?: boolean;
    onToggle?: () => void;
}

export const AdminSection = ({
                                 title,
                                 icon,
                                 description,
                                 children,
                                 actions,
                                 collapsible = false,
                                 expanded = true,
                                 onToggle
                             }: AdminSectionProps) => {
    const HeaderComponent = collapsible ? 'button' : 'div';

    return (
        <div className={styles.section}>
            <HeaderComponent
                className={collapsible ? styles.collapsible_header : styles.section_header}
                onClick={collapsible ? onToggle : undefined}
            >
                <div className={styles.header_content}>
                    <div className={styles.header_text}>
                        <h2 className={styles.section_title}>
                            {icon}
                            {title}
                        </h2>
                        {description && (
                            <p className={styles.section_description}>{description}</p>
                        )}
                    </div>

                    {actions && (
                        <div className={styles.header_actions}>
                            {actions}
                        </div>
                    )}
                </div>

                {collapsible && (
                    <span className={`${styles.chevron} ${expanded ? styles.expanded : ''}`}>
                        ▼
                    </span>
                )}
            </HeaderComponent>

            {children && (
                <div className={`${styles.section_content} ${
                    collapsible && !expanded ? styles.collapsed : ''
                }`}>
                    {children}
                </div>
            )}
        </div>
    );
};
