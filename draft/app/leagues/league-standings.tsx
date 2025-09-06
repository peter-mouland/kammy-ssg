/* Location: app/leagues/league-standings.tsx */

import { useMemo } from 'react';
import { Link, useLoaderData, useNavigate, useSearchParams } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import { SelectDivision } from '../_shared/components/select-division';
import { RankBadge, Table, type TableColumn } from '../_shared/components/table';
import { TimeTravelBanner } from '../_shared/components/time-travel-banner';
import { UserSelectionProvider } from '../_shared/features/user-selection/user-selection-provider';
import { GameweekSelector } from '../teams/components/gameweek-selector';
import { PositionRankChange } from './components/position-rank-change';
import styles from './league-standings.module.css';
import { calculatePositionRankings } from './lib/simple-position-rankings';
import type {
    EnhancedLeagueStandingsLoaderData,
    LeagueStandingsTeamData,
    PositionColumnConfig,
} from './types/league-standings-types';

const POSITION_COLUMNS: PositionColumnConfig[] = [
    {
        key: 'gk',
        label: 'GK / Sub',
        mobileLabel: 'GKS',
        slots: ['gk_0', 'sub_0'],
        color: 'var(--color-position-gk)',
    },
    {
        key: 'cb',
        label: 'CB',
        slots: ['cb_0', 'cb_1'],
        color: 'var(--color-position-cb)',
    },
    {
        key: 'fb',
        label: 'FB',
        slots: ['fb_0', 'fb_1'],
        color: 'var(--color-position-fb)',
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
        color: 'var(--color-position-wa)',
    },
    {
        key: 'ca',
        label: 'CA',
        slots: ['ca_0', 'ca_1'],
        color: 'var(--color-position-ca)',
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
    title: string;
    subtitle: string;
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
            hideOnMobile: true,
            width: 60,
            sortable: false,
            render: (_, team, index) => <RankBadge rank={index + 1} />,
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
                render: (points, team) => {
                    // For season table, show rank and points as before
                    if (!showRankChange) {
                        const rank = positionRankings[team.userId]?.[col.key];
                        return (
                            <div>
                                {rank && <span className={styles.positionRank}>{rank}</span>}
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
            render: (rank, team) => {
                if (showRankChange) {
                    // For gameweek table, show points with rank change
                    return (
                        <PositionRankChange
                            points={team[pointsSource]['total']}
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
        <div className={'card'} style={{ marginBottom: '2rem', marginLeft: '-0.5rem', marginRight: '-0.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <h3 className={styles.tableTitle}>{title}</h3>
                <p className={styles.tableSubtitle}>{subtitle}</p>
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

function DivisionStandingsTable({
    division,
    teams,
    selectedGameweek,
}: {
    division: { id: string; label: string };
    teams: LeagueStandingsTeamData[];
    selectedGameweek: number;
}) {
    const isFirstGameweek = selectedGameweek === 0;

    if (teams.length === 0) {
        return (
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h2 className="card-title">📊 {division.label} Division</h2>
                </div>
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>No Teams in Division</h3>
                    <p style={{ margin: 0 }}>No teams have been added to the {division.label} division yet.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <PositionPointsTable
                teams={teams}
                pointsSource="seasonPoints"
                title="🏆 Season Standings"
                subtitle={`Total points accumulated until gameweek ${selectedGameweek}`}
                showRankChange={false}
                selectedGameweek={selectedGameweek}
            />

            <PositionPointsTable
                teams={teams}
                pointsSource="gameweekPoints"
                title={`⚡ Gameweek ${selectedGameweek}`}
                subtitle={`Points scored during gameweek ${selectedGameweek}${isFirstGameweek ? '' : ' with position rank changes'}`}
                showRankChange={true}
                isFirstGameweek={isFirstGameweek}
                selectedGameweek={selectedGameweek}
            />
        </>
    );
}

export const LeagueStandings = () => {
    const data = useLoaderData<EnhancedLeagueStandingsLoaderData>();

    return (
        <UserSelectionProvider
            users={data.userTeams}
            onUserSelected={console.log}
            redirectOnSelection={false} // Reload page with new user
            fallbackContent={
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2>Welcome to Fantasy Football!</h2>
                    <p>Please select your profile to continue</p>
                </div>
            }
            initialSelection={data.persistedUser}
        >
            <LeagueStandingsComp {...data} />
        </UserSelectionProvider>
    );
};

const LeagueStandingsComp = ({
    divisions,
    selectedDivision,
    selectedGameweek,
    currentGameweek,
    selectedGameweekData,
    currentGameweekData,
    availableGameweeks,
    standingsData,
    persistedUser,
}: EnhancedLeagueStandingsLoaderData) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isCurrentGameweek = !searchParams.get('gameweek') || searchParams.get('gameweek') === String(currentGameweek);

    const handleDivisionChange = (divisionId: string) => {
        if (divisionId !== 'all') {
            navigate(`/leagues/${divisionId}?gameweek=${selectedGameweek}`);
        } else {
            navigate(`/leagues?gameweek=${selectedGameweek}`);
        }
    };

    return (
        <>
            <PageHeader
                title={`${selectedDivision?.label} Standings`}
                actions={
                    <>
                        <SelectDivision
                            divisions={divisions}
                            selectedDivision={selectedDivision?.id}
                            handleDivisionChange={handleDivisionChange}
                        />
                        <GameweekSelector
                            currentGameweekData={currentGameweekData}
                            selectedGameweekData={selectedGameweekData}
                            availableGameweeks={availableGameweeks}
                        />
                    </>
                }
            />

            {!isCurrentGameweek && <TimeTravelBanner currentGameweek={currentGameweek} />}

            {/* Show specific division if selected */}
            {selectedDivision ? (
                <DivisionStandingsTable
                    division={selectedDivision}
                    teams={standingsData[selectedDivision?.id] || []}
                    selectedGameweek={selectedGameweek}
                />
            ) : (
                /* Show all divisions */
                <div>
                    {divisions.length === 0 ? (
                        <div className="card">
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>No Divisions Found</h3>
                                <p style={{ margin: 0 }}>
                                    No divisions have been created yet. Create divisions to organize your league
                                    standings.
                                </p>
                            </div>
                        </div>
                    ) : (
                        divisions
                            .sort((a, b) => a.order - b.order)
                            .map((division) => {
                                return (
                                    <DivisionStandingsTable
                                        key={division.id}
                                        division={division}
                                        teams={standingsData[division.id] || []}
                                        selectedGameweek={selectedGameweek}
                                    />
                                );
                            })
                    )}
                </div>
            )}
        </>
    );
};
