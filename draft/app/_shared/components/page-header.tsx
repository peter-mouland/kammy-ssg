/* Location: app/_shared/components/page-header.tsx */

import styles from './page-header.module.css';

interface PageHeaderProps {
    title: string;
    subTitle?: string;
    actions?: React.ReactNode;
}

export const PageHeader = ({ title, subTitle, actions }: PageHeaderProps) => (
    <div className={styles.pageHeader}>
        <div className={styles.primary}>
            <h1 className={styles.pageTitle}>{title}</h1>
            {actions}
        </div>
        {subTitle ? <p className={styles.pageSubtitle}>
            {subTitle}
        </p> : null }
    </div>
);
