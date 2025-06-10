import styles from './layout-grid.module.css';

export const LayoutGrid = ({ children }) => (
    <div className={styles.divisionGrid}>
        {children}
    </div>
)
