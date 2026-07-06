/* Location: app/cup/cup.page.tsx */

import { Link, useLoaderData } from 'react-router';
import styles from './cup.module.css';
import { CUP_STAGES } from './lib/cup-rules';
import type { CupOverviewRow, CupPageData } from './types/cup-page-types';

function StatusCell({ row }: { row: CupOverviewRow }) {
    if (row.visibility === 'revealed') {
        return <span className={styles.revealed}>{row.players?.length ?? 0} players submitted</span>;
    }
    if (row.visibility === 'submitted_hidden') {
        return <span className={styles.hidden}>🔒 Hidden until deadline</span>;
    }
    return <span className={styles.pending}>Not submitted</span>;
}

export function CupPage() {
    const data = useLoaderData<CupPageData>();
    const stageLabel = data.round ? CUP_STAGES[data.round.stage].label : null;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Cup</h1>
                    {stageLabel && (
                        <span className={styles.roundLabel}>
                            {stageLabel}
                            {data.round?.twoLegged ? ` · Leg ${data.round.leg}` : ''} · GW{data.gameweek}
                        </span>
                    )}
                </div>
                <Link to="/cup/submit" className={styles.submitLink}>
                    Submit my team
                </Link>
            </div>

            {data.hasConfig ? (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.headerCell}>Manager</th>
                            <th className={styles.headerCell}>Division</th>
                            <th className={styles.headerCell}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row) => (
                            <tr key={row.manager}>
                                <td className={styles.cell}>
                                    <span className={styles.managerName}>{row.userName}</span>
                                    <span className={styles.teamName}>{row.teamName}</span>
                                </td>
                                <td className={styles.cell}>{row.division}</td>
                                <td className={styles.cell}>
                                    <StatusCell row={row} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className={styles.notice}>
                    The cup isn't set up for this gameweek yet. An admin needs to map the cup stages to gameweeks.
                </p>
            )}
        </div>
    );
}

export default CupPage;
