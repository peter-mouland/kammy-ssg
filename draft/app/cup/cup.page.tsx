/* Location: app/cup/cup.page.tsx */

import { Link, useLoaderData, useSearchParams } from 'react-router';
import { SelectUser } from '../_shared/components/select-user';
import { setUserSelection } from '../_shared/features/user-selection/user-selection.utils';
import styles from './cup.module.css';
import { CUP_STAGES } from './lib/cup-rules';
import type { CupOverviewRow, CupPageData } from './types/cup-page-types';

function CupFixtures({ data }: { data: CupPageData }) {
    if (data.fixtures.length === 0) return null;
    return (
        <section className={styles.fixtures}>
            <h2 className={styles.sectionTitle}>Fixtures · GW{data.selectedGameweek}</h2>
            <ul className={styles.fixtureList}>
                {data.fixtures.map((fixture) => (
                    <li key={`${fixture.home}-${fixture.away}`} className={styles.fixture}>
                        <span className={styles.fixtureTeam}>{fixture.home}</span>
                        <span className={styles.fixtureScore}>
                            {fixture.started ? `${fixture.homeScore}–${fixture.awayScore}` : 'v'}
                        </span>
                        <span className={styles.fixtureTeam}>{fixture.away}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

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

function Bracket({ data }: { data: CupPageData }) {
    if (data.bracket.length === 0) return null;
    return (
        <section className={styles.qualifiers}>
            <h2 className={styles.sectionTitle}>Knockout bracket</h2>
            <ul className={styles.qualifierList}>
                {data.bracket.map((matchup) => (
                    <li key={`${matchup.stage}-${matchup.tie}`} className={styles.qualifierItem}>
                        <span className={styles.qualifierName}>{matchup.home ?? 'TBC'}</span>
                        <span className={styles.pending}>v</span>
                        <span className={styles.qualifierName}>{matchup.away ?? 'BYE'}</span>
                    </li>
                ))}
            </ul>
        </section>
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

    function handleUserChange(userId: string) {
        setUserSelection(userId, false); // persist to the cookie so /cup/submit sees it
        const next = new URLSearchParams(searchParams);
        next.set('userId', userId);
        setSearchParams(next);
    }

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
                <div className={styles.headerActions}>
                    <SelectUser
                        users={data.userTeams}
                        selectedUser={data.selectedUserId}
                        handleUserChange={handleUserChange}
                    />
                    <GameweekSelector data={data} />
                    <Link to="/cup/submit" className={styles.submitLink}>
                        Submit my team
                    </Link>
                </div>
            </div>

            <CupFixtures data={data} />

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

            <Bracket data={data} />
            <QualifiersTable data={data} />
        </div>
    );
}

export default CupPage;
