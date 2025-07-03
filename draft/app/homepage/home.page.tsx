/* Location: app/leagues/league-standings.tsx */

import { useMemo } from 'react';
import { Link, useLoaderData } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import { RankBadge, Table, type TableColumn } from '../_shared/components/table';
import styles from '../leagues/components/league-standings.module.css';
import { PositionRankChange } from '../leagues/components/position-rank-change';
import { calculatePositionRankings } from '../leagues/lib/simple-position-rankings';
import type {
    EnhancedLeagueStandingsLoaderData,
    LeagueStandingsTeamData,
    PositionColumnConfig,
} from '../leagues/types/league-standings-types';

export const POSITION_COLUMNS: PositionColumnConfig[] = [
    {
        key: 'gk',
        label: 'GK / Sub',
        slots: ['gk_0', 'sub_0'],
        color: 'var(--color-position-gk)',
    },
    {
        key: 'cb',
        label: 'CB',
        slots: ['cb_0', 'cb_1'],
        color: 'var(--color-position-def)',
    },
    {
        key: 'fb',
        label: 'FB',
        slots: ['fb_0', 'fb_1'],
        color: 'var(--color-position-def)',
    },
    {
        key: 'mid',
        label: 'MID',
        slots: ['mid_0', 'mid_1'],
        color: 'var(--color-position-mid)',
    },
    {
        key: 'wa',
        label: 'WA',
        slots: ['wa_0', 'wa_1'],
        color: 'var(--color-warning)',
    },
    {
        key: 'ca',
        label: 'CA',
        slots: ['ca_0', 'ca_1'],
        color: 'var(--color-position-att)',
    },
];

function PositionPointsTable({
    teams,
    pointsSource,
    title,
    subtitle,
    showRankChange = false,
    isFirstGameweek = false,
    selectedGameweek,
}: {
    teams: LeagueStandingsTeamData[];
    pointsSource: 'gameweekPoints' | 'seasonPoints';
    title: React.ReactNode;
    subtitle?: string;
    showRankChange?: boolean;
    isFirstGameweek?: boolean;
    selectedGameweek?: number;
}) {
    const positionRankings = useMemo(() => calculatePositionRankings(teams, pointsSource), [teams, pointsSource]);

    // Define table columns for sortable table
    const columns: TableColumn<LeagueStandingsTeamData>[] = [
        {
            key: 'rank',
            header: 'Rank',
            width: 60,
            sortable: false,
            render: (_, team, index) => <RankBadge rank={index + 1} />,
        },
        {
            key: 'manager',
            header: 'Manager',
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
                header: col.label,
                width: 80,
                align: 'center',
                sortable: true,
                accessor: (team) => team[pointsSource][col.key],
                render: (points, team) => {
                    // For season table, show rank and points as before
                    if (!showRankChange) {
                        const rank = positionRankings[team.userId]?.[col.key];
                        return (
                            <div>
                                <span>
                                    {rank && (
                                        <span
                                            className={styles.positionRank}
                                            style={{
                                                color: points > 0 ? col.color : 'var(--color-gray-400)',
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {rank}
                                        </span>
                                    )}
                                </span>
                                <span
                                    className={styles.points}
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--color-gray-400)',
                                        marginLeft: '1rem',
                                    }}
                                >
                                    {points}
                                </span>
                            </div>
                        );
                    }

                    // For gameweek table, show points with rank change
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
            accessor: (team) => positionRankings[team.userId]?.total,
            render: (points, team) => {
                const rank = positionRankings[team.userId]?.total;
                if (showRankChange) {
                    // For gameweek table, show points with rank change
                    return (
                        <PositionRankChange
                            points={points}
                            rankChange={team.positionRankChanges?.total ?? null}
                            isFirstGameweek={isFirstGameweek}
                        />
                    );
                } else {
                    return (
                        <div>
                            {rank && (
                                <span
                                    className={styles.positionRank}
                                    style={{
                                        fontSize: '1rem',
                                        color: 'var(--color-primary)',
                                    }}
                                >
                                    {rank}
                                </span>
                            )}
                            <span
                                className={styles.points}
                                style={{
                                    fontWeight: 'var(--font-weight-bold)',
                                    color: 'var(--color-gray-400)',
                                    marginLeft: '1rem',
                                }}
                            >
                                {team[pointsSource].total || 0}
                            </span>
                        </div>
                    );
                }
            },
        },
    ];

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
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>

            <Table
                data={teams}
                columns={columns}
                defaultSort={{ key: 'total', direction: 'desc' }}
                className="table-compact"
                getCellProps={(team, index, column) => ({
                    style: showRankChange
                        ? {}
                        : {
                              borderBottom:
                                  index === 2
                                      ? '1px dashed var(--color-green-500)'
                                      : teams.length - 4 === index
                                        ? '1px dashed var(--color-red-500)'
                                        : undefined,
                          },
                })}
            />

            {/* Table Summary */}
            {teams.length > 0 && (
                <div
                    style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderTop: '1px solid #e2e8f0',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '1rem',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                            {Math.max(...teams.map((team) => team[pointsSource].total))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Leader</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                            {Math.round(teams.reduce((sum, team) => sum + team[pointsSource].total, 0) / teams.length)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Average</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                            {Math.max(...teams.map((team) => team[pointsSource].total))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Top Score</div>
                    </div>
                </div>
            )}

            {/* Rank Change Legend for Gameweek Table */}
            {showRankChange && !isFirstGameweek && (
                <div
                    style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderTop: '1px solid #e2e8f0',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                    }}
                >
                    <strong>Rank Changes:</strong>
                    <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>+2 = moved up 2 positions</span>
                    <span style={{ color: '#ef4444', marginLeft: '1rem' }}>-1 = moved down 1 position</span>
                    <span style={{ marginLeft: '1rem' }}>- = no change</span>
                </div>
            )}
        </div>
    );
}

export const LeagueStandings = () => {
    const { divisions, selectedGameweek, standingsData } = useLoaderData<EnhancedLeagueStandingsLoaderData>();

    return (
        <div>
            <PageHeader title={'Standings'} subTitle={`Total points accumulated until gameweek ${selectedGameweek}`} />
            {divisions
                .sort((a, b) => a.order - b.order)
                .map((division) => {
                    return (
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <PositionPointsTable
                                teams={standingsData[division.id] || []}
                                pointsSource="seasonPoints"
                                title={<Link to={`/leagues/${division.id}`}>{division.label}</Link>}
                                showRankChange={false}
                                selectedGameweek={selectedGameweek}
                            />
                        </div>
                    );
                })}
        </div>
    );
};
