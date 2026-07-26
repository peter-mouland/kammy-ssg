import { useMemo } from 'react';
import { Link } from 'react-router';
import { RankBadge, Table, type TableColumn } from '../../_shared/components/table';
import type { DivisionId } from '../../_shared/types/league-types';
import { POSITION_COLUMNS } from '../constants/position-columns';
import styles from '../league-standings.module.css';
import { calculatePositionRankings } from '../lib/simple-position-rankings';
import { getStandingsRowMarker, type StandingsRowMarker } from '../lib/standings-table-markers';
import type { LeagueStandingsTeamData } from '../types/league-standings-types';
import { PositionRankChange } from './position-rank-change';

const MARKER_ROW_CLASS: Record<StandingsRowMarker, string> = {
    prize: styles.secondPlacePrizeRow,
    promotion: styles.promotionRow,
    relegation: styles.relegationRow,
};

export type PositionPointsTableProps = {
    teams: LeagueStandingsTeamData[];
    pointsSource: 'gameweekPoints' | 'seasonPoints';
    title: React.ReactNode;
    subtitle?: string;
    showRankChange?: boolean;
    isFirstGameweek?: boolean;
    selectedGameweek?: number;
    divisionId?: DivisionId;
    layout?: 'card' | 'plain';
};

export function PositionPointsTable({
    teams,
    pointsSource,
    title,
    subtitle,
    showRankChange = false,
    isFirstGameweek = false,
    selectedGameweek,
    divisionId,
    layout = 'card',
}: PositionPointsTableProps) {
    const positionRankings = useMemo(() => calculatePositionRankings(teams, pointsSource), [teams, pointsSource]);

    const columns: TableColumn<LeagueStandingsTeamData>[] = [
        {
            key: 'rank',
            header: 'Rank',
            hideOnMobile: true,
            width: 60,
            sortable: false,
            render: (_, _team, index) => <RankBadge rank={index + 1} />,
        },
        {
            key: 'manager',
            header: 'User',
            accessor: 'userName',
            width: 180,
            sortable: true,
            render: (userName) => (
                <Link to={`/teams/${userName}?gameweek=${selectedGameweek}`} className={styles.managerName}>
                    {userName}
                </Link>
            ),
        },
        ...POSITION_COLUMNS.map(
            (col): TableColumn<LeagueStandingsTeamData> => ({
                key: col.key,
                header: (
                    <span>
                        <span className={styles.mobileLabel}>{col.mobileLabel || col.label}</span>
                        <span className={styles.label}>{col.label}</span>
                    </span>
                ),
                width: 80,
                align: 'center',
                sortable: true,
                accessor: (team) => team[pointsSource][col.key],
                onSort: (data, direction) => {
                    const dir = direction === 'asc' ? 1 : -1;
                    return [...data].sort((a, b) => {
                        const aRank = showRankChange
                            ? (a.positionRankChanges?.[col.key] ?? 0)
                            : (positionRankings[a.userId]?.[col.key] ?? 0);
                        const bRank = showRankChange
                            ? (b.positionRankChanges?.[col.key] ?? 0)
                            : (positionRankings[b.userId]?.[col.key] ?? 0);
                        if (aRank !== bRank) return (aRank - bRank) * dir;
                        return (a[pointsSource][col.key] - b[pointsSource][col.key]) * dir;
                    });
                },
                render: (points, team) => {
                    if (!showRankChange) {
                        const rank = positionRankings[team.userId]?.[col.key];
                        return (
                            <div>
                                {rank != null && (
                                    <span className={`${styles.positionRank} ${col.key} points-${points}`}>{rank}</span>
                                )}
                                <span className={styles.points}>{points}</span>
                            </div>
                        );
                    }

                    return (
                        <PositionRankChange
                            points={points}
                            rankChange={team.positionRankChanges?.[col.key] ?? null}
                            isFirstGameweek={isFirstGameweek}
                        />
                    );
                },
            }),
        ),
        {
            key: 'total',
            header: 'Total',
            width: 100,
            align: 'center',
            sortable: true,
            accessor: (team) =>
                showRankChange ? (team.positionRankChanges?.total ?? 0) : (positionRankings[team.userId]?.total ?? 0),
            onSort: (data, direction) => {
                const dir = direction === 'asc' ? 1 : -1;
                return [...data].sort((a, b) => {
                    const aRank = showRankChange
                        ? (a.positionRankChanges?.total ?? 0)
                        : (positionRankings[a.userId]?.total ?? 0);
                    const bRank = showRankChange
                        ? (b.positionRankChanges?.total ?? 0)
                        : (positionRankings[b.userId]?.total ?? 0);
                    if (aRank !== bRank) return (aRank - bRank) * dir;
                    return (a[pointsSource].total - b[pointsSource].total) * dir;
                });
            },
            render: (_value, team) => {
                if (showRankChange) {
                    return (
                        <PositionRankChange
                            points={team[pointsSource].total}
                            rankChange={team.positionRankChanges?.total ?? null}
                            isFirstGameweek={isFirstGameweek}
                        />
                    );
                }

                const rank = positionRankings[team.userId]?.total;
                return (
                    <div>
                        {rank != null && <span className={styles.positionRank}>{rank}</span>}
                        <span className={styles.points}>{team[pointsSource].total || 0}</span>
                    </div>
                );
            },
        },
    ];

    const table = (
        <Table
            data={teams}
            columns={columns}
            defaultSort={{ key: 'total', direction: 'desc' }}
            className="table-compact"
            getRowProps={(_team, index) => {
                if (showRankChange || !divisionId) return {};

                const marker = getStandingsRowMarker(divisionId, index, teams.length);
                if (!marker) return {};

                return { className: MARKER_ROW_CLASS[marker] };
            }}
        />
    );

    if (layout === 'plain') {
        return (
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <h3
                        style={{
                            margin: '0 0 0.25rem 0',
                            fontSize: 'var(--font-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                        }}
                    >
                        {title}
                    </h3>
                    {subtitle && <p className={styles.tableSubtitle}>{subtitle}</p>}
                </div>
                {table}
            </div>
        );
    }

    return (
        <div className="card" style={{ marginBottom: '2rem', marginLeft: '-0.5rem', marginRight: '-0.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h3 className={styles.tableTitle}>{title}</h3>
                {subtitle && <p className={styles.tableSubtitle}>{subtitle}</p>}
            </div>
            {table}
        </div>
    );
}
