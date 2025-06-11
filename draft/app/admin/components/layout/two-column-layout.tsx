import React from 'react';
import styles from './two-column-layout.module.css';

// Container Component
interface TwoColumnContainerProps {
    children: React.ReactNode;
    maxWidth?: string;
    gap?: 'sm' | 'md' | 'lg';
    className?: string;
}

const TwoColumnContainer = ({
                                children,
                                maxWidth = '1200px',
                                gap = 'lg',
                                className = ''
                            }: TwoColumnContainerProps) => {
    const gapClass = styles[`gap_${gap}`];

    return (
        <div
            className={`${styles.layout_wrapper} ${gapClass} ${className}`}
            style={{ '--max-width': maxWidth } as React.CSSProperties}
        >
            {children}
        </div>
    );
};

// Header Component
interface TwoColumnHeaderProps {
    children: React.ReactNode;
    className?: string;
}

const TwoColumnHeader = ({ children, className = '' }: TwoColumnHeaderProps) => {
    return (
        <div className={`${styles.layout_header} ${className}`}>
            {children}
        </div>
    );
};

// Content Container (for sidebar + content)
interface TwoColumnContentContainerProps {
    children: React.ReactNode;
    className?: string;
}

const TwoColumnContentContainer = ({ children, className = '' }: TwoColumnContentContainerProps) => {
    return (
        <div className={`${styles.layout_content_container} ${className}`}>
            {children}
        </div>
    );
};

// Sidebar Component
interface TwoColumnSidebarProps {
    children: React.ReactNode;
    width?: string;
    className?: string;
}

const TwoColumnSidebar = ({
                              children,
                              width = '16rem',
                              className = ''
                          }: TwoColumnSidebarProps) => {
    return (
        <aside
            className={`${styles.sidebar} ${className}`}
            style={{ '--sidebar-width': width } as React.CSSProperties}
        >
            {children}
        </aside>
    );
};

// Content Component
interface TwoColumnContentProps {
    children: React.ReactNode;
    className?: string;
}

const TwoColumnContent = ({ children, className = '' }: TwoColumnContentProps) => {
    return (
        <main className={`${styles.content} ${className}`}>
            {children}
        </main>
    );
};

// Compound Component
export const TwoColumnLayout = {
    Container: TwoColumnContainer,
    Header: TwoColumnHeader,
    ContentContainer: TwoColumnContentContainer,
    Sidebar: TwoColumnSidebar,
    Content: TwoColumnContent
};
