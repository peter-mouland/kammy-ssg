import styles from './page-header.module.css';

export const PageHeader = ({ title, subTitle, actions }) => (
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
