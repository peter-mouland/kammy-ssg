import { Link } from "react-router";
import styles from './quick-actions.module.css';

export function QuickActions() {
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">⚡ Quick Actions</h2>
                <p className={styles.subtitle}>
                    Common tasks and shortcuts
                </p>
            </div>

            <div className={styles.actionsList}>
                <Link to="/draft" className="btn btn-primary">
                    🎯 Join Draft Room
                </Link>
                <Link to="/draft/admin" className="btn btn-secondary">
                    ⚙️ Draft Setup
                </Link>
            </div>
        </div>
    );
}
