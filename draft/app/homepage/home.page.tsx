/* Location: app/leagues/league-standings.tsx */

import { useMemo } from 'react';
import { Link, useLoaderData } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import { RankBadge, Table, type TableColumn } from '../_shared/components/table';
import { PositionRankChange } from '../leagues/components/position-rank-change';
import { TeamOfTheWeek } from '../leagues/components/team-of-the-week';
import styles from '../leagues/league-standings.module.css';
import { calculatePositionRankings } from '../leagues/lib/simple-position-rankings';
import type {
    EnhancedLeagueStandingsLoaderData,
    LeagueStandingsTeamData,
    PositionColumnConfig,
} from '../leagues/types/league-standings-types';

const POSITION_COLUMNS: PositionColumnConfig[] = [
    {
        key: 'gk',
        mobileLabel: 'GKS',
        label: 'GK / Sub',
        slots: ['gk_0', 'sub_0'],
    },
    {
        key: 'cb',
        label: 'CB',
        slots: ['cb_0', 'cb_1'],
    },
    {
        key: 'fb',
        label: 'FB',
        slots: ['fb_0', 'fb_1'],
    },
    {
        key: 'mid',
        label: 'MID',
        slots: ['mid_0', 'mid_1'],
    },
    {
        key: 'wa',
        label: 'WA',
        slots: ['wa_0', 'wa_1'],
    },
    {
        key: 'ca',
        label: 'CA',
        slots: ['ca_0', 'ca_1'],
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
            hideOnMobile: true,
            render: (_, team, index) => <RankBadge rank={index + 1} />,
        },
        {
            key: 'manager',
            header: 'User',
            accessor: 'userName',
            width: 180,
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
                accessor: (team) => team[pointsSource][col.key],
                render: (points, team) => {
                    // For season table, show rank and points as before
                    if (!showRankChange) {
                        const rank = positionRankings[team.userId]?.[col.key];
                        return (
                            <div>
                                {rank && (
                                    <span className={`${styles.positionRank} ${col.key} points-${points}`}>{rank}</span>
                                )}
                                <span className={styles.points}>{points}</span>
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
                            {rank && <span className={styles.positionRank}>{rank}</span>}
                            <span className={styles.points}>{team[pointsSource].total || 0}</span>
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
        </div>
    );
}

export const LeagueStandings = () => {
    const { divisions, selectedGameweek, standingsData, teamOfTheWeek } =
        useLoaderData<EnhancedLeagueStandingsLoaderData>();

    return (
        <div>
            <PageHeader
                title={'All Standings'}
                subTitle={`Total points accumulated until gameweek ${selectedGameweek}`}
            />
            {divisions
                .sort((a, b) => (a.order < b.order ? -1 : 1))
                .map((division) => {
                    return (
                        <PositionPointsTable
                            key={division.id}
                            teams={standingsData[division.id] || []}
                            pointsSource="seasonPoints"
                            title={<Link to={`/leagues/${division.id}`}>{division.label}</Link>}
                            showRankChange={false}
                            selectedGameweek={selectedGameweek}
                        />
                    );
                })}

            {teamOfTheWeek && <TeamOfTheWeek data={teamOfTheWeek} />}
        </div>
    );
};
