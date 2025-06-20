/* Location: app/_shared/components/layout-grid.tsx */

import styles from './layout-grid.module.css';

interface LayoutGridProps {
    children: React.ReactNode;
}

export const LayoutGrid : React.FC<LayoutGridProps> = ({ children }) => <div className={styles.divisionGrid}>{children}</div>;
