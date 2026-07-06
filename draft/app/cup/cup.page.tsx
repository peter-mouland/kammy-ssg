/* Location: app/cup/cup.page.tsx */

import { Link, useLoaderData, useSearchParams } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import { SelectUser } from '../_shared/components/select-user';
import { setUserSelection } from '../_shared/features/user-selection/user-selection.utils';
import { CupFixtures } from './components/cup-fixtures';
import styles from './cup.module.css';
import { CUP_STAGES } from './lib/cup-rules';
import type { CupOverviewRow, CupPageData } from './types/cup-page-types';

function GameweekSelector({ data }: { data: CupPageData }) {
    const [searchParams, setSearchParams] = useSearchParams();
    if (data.gameweekOptions.length === 0) return null;
    return (
        <label className={styles.selector}>
            <span className={styles.selectorLabel}>Round</span>
            <select
                className={styles.select}
                value={data.selectedGameweek}
                onChange={(event) => {
                    const next = new URLSearchParams(searchParams);
                    next.set('gameweek', event.target.value);
                    setSearchParams(next);
                }}
            >
                {data.gameweekOptions.map((option) => (
                    <option key={option.gameweek} value={option.gameweek}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function StatusCell({ row }: { row: CupOverviewRow }) {
    if (row.visibility === 'revealed') {
        return <span className={styles.revealed}>{row.points ?? 0} pts</span>;
    }
    if (row.visibility === 'submitted_hidden') {
        return <span className={styles.hidden}>🔒 Hidden until deadline</span>;
    }
    return <span className={styles.pending}>Not submitted</span>;
}

function sideScore(points: number | null, aggregate: number | null): string {
    if (aggregate !== null) return `${points ?? 0} (agg ${aggregate})`;
    return points === null ? '–' : String(points);
}

function StageMatchups({ data }: { data: CupPageData }) {
    const label = data.round ? CUP_STAGES[data.round.stage].label : '';
    if (data.stageMatchups.length === 0) {
        return (
            <p className={styles.notice}>
                The {label} draw hasn't been generated yet — an admin can create it from the cup admin page.
            </p>
        );
    }
    return (
        <ul className={styles.matchupList}>
            {data.stageMatchups.map((matchup) => (
                <li key={matchup.tie} className={styles.matchup}>
                    <span
                        className={`${styles.matchupName} ${matchup.winner && matchup.winner === matchup.home.manager ? styles.matchupWinner : ''}`}
                    >
                        {matchup.home.name}
                    </span>
                    <span className={styles.matchupScore}>
                        {sideScore(matchup.home.points, matchup.home.aggregate)}
                    </span>
                    <span className={styles.vs}>v</span>
                    <span className={styles.matchupScore}>
                        {sideScore(matchup.away.points, matchup.away.aggregate)}
                    </span>
                    <span
                        className={`${styles.matchupName} ${matchup.winner && matchup.winner === matchup.away.manager ? styles.matchupWinner : ''}`}
                    >
                        {matchup.away.name}
                    </span>
                </li>
            ))}
        </ul>
    );
}

function QualifiersTable({ data }: { data: CupPageData }) {
    if (data.qualifiers.length === 0) return null;
    return (
        <section className={styles.qualifiers}>
            <h2 className={styles.sectionTitle}>Qualifiers (Round of 16)</h2>
            <ol className={styles.qualifierList}>
                {data.qualifiers.map((qualifier) => (
                    <li key={qualifier.manager} className={styles.qualifierItem}>
                        <span className={styles.qualifierRank}>{qualifier.rank}</span>
                        <span className={styles.qualifierName}>{qualifier.userName}</span>
                    </li>
                ))}
            </ol>
        </section>
    );
}

export function CupPage() {
    const data = useLoaderData<CupPageData>();
    const [searchParams, setSearchParams] = useSearchParams();
    const stageLabel = data.round ? CUP_STAGES[data.round.stage].label : null;
    const isKnockout = !!data.round && data.round.stage !== 'league';

    function handleUserChange(userId: string) {
        setUserSelection(userId, false); // persist to the cookie so /cup/submit sees it
        const next = new URLSearchParams(searchParams);
        next.set('userId', userId);
        setSearchParams(next);
    }

    const subTitle = stageLabel
        ? `${stageLabel}${data.round?.twoLegged ? ` · Leg ${data.round.leg}` : ''} · GW${data.gameweek}`
        : undefined;

    return (
        <div className={styles.page}>
            <PageHeader
                title="Cup"
                subTitle={subTitle}
                actions={
                    <>
                        <SelectUser
                            users={data.userTeams}
                            selectedUser={data.selectedUserId}
                            handleUserChange={handleUserChange}
                        />
                        <GameweekSelector data={data} />
                        <Link to={`/cup/submit?gameweek=${data.selectedGameweek}`} className={styles.submitLink}>
                            Submit my team
                        </Link>
                    </>
                }
            />

            <CupFixtures fixtures={data.fixtures} gameweek={data.selectedGameweek} />

            {data.hasConfig ? (
                isKnockout ? (
                    <StageMatchups data={data} />
                ) : (
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
                )
            ) : (
                <p className={styles.notice}>
                    The cup isn't set up for this gameweek yet. An admin needs to map the cup stages to gameweeks.
                </p>
            )}

            {!isKnockout && <QualifiersTable data={data} />}
        </div>
    );
}

export default CupPage;
