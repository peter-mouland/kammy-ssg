/* Location: app/leagues/league-standings.tsx */

import { useMemo } from 'react';
import { Link, useActionData, useLoaderData, useNavigate, useSearchParams } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import { SelectDivision } from '../_shared/components/select-division';
import { RankBadge, Table, type TableColumn } from '../_shared/components/table';
import { TimeTravelBanner } from '../_shared/components/time-travel-banner';
import { GameweekSelector } from '../teams/components/gameweek-selector';
import styles from './components/league-standings.module.css';
import { PositionRankChange } from './components/position-rank-change';
import { calculatePositionRankings } from './lib/simple-position-rankings';
import type {
    EnhancedLeagueStandingsLoaderData,
    LeagueStandingsTeamData,
    PositionColumnConfig,
} from './types/league-standings-types';

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
            accessor: (team) => team[pointsSource]['total'],
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
                <p className={styles.subtitle}>{subtitle}</p>
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
        <div className="card" style={{ marginBottom: '2rem' }}>
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
        </div>
    );
}

export const LeagueStandings = () => {
    const {
        divisions,
        selectedDivision,
        selectedGameweek,
        currentGameweek,
        selectedGameweekData,
        currentGameweekData,
        availableGameweeks,
        standingsData,
    } = useLoaderData<EnhancedLeagueStandingsLoaderData>();

    const navigate = useNavigate();
    const actionData = useActionData<typeof action>();
    const [searchParams, setSearchParams] = useSearchParams();
    const isCurrentGameweek = !searchParams.get('gameweek') || searchParams.get('gameweek') === String(currentGameweek);

    const handleDivisionChange = (divisionId: string) => {
        if (divisionId !== 'all') {
            navigate(`/leagues/${divisionId}?gameweek=${selectedGameweek}`);
        } else {
            navigate(`/leagues?gameweek=${selectedGameweek}`);
        }
    };

    const handleGameweekChange = (gameweek: number) => {
        const newParams = new URLSearchParams();
        if (selectedDivision) {
            newParams.set('division', selectedDivision.id);
        }
        if (gameweek !== currentGameweek) {
            newParams.set('gameweek', gameweek.toString());
        }
        setSearchParams(newParams);
    };

    return (
        <div>
            <PageHeader
                title={`${selectedDivision.label} Standings`}
                actions={
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
                        <GameweekSelector
                            currentGameweekData={currentGameweekData}
                            selectedGameweekData={selectedGameweekData}
                            availableGameweeks={availableGameweeks}
                            onGameweekChange={handleGameweekChange}
                        />
                        <SelectDivision
                            divisions={divisions}
                            selectedDivision={selectedDivision.id}
                            handleDivisionChange={handleDivisionChange}
                        />
                    </div>
                }
            />

            {!isCurrentGameweek && <TimeTravelBanner currentGameweek={currentGameweek} />}

            {/* Action Messages */}
            {actionData?.success && (
                <div className="success" style={{ marginBottom: '1rem' }}>
                    ✅ Standings updated successfully!
                </div>
            )}

            {actionData?.error && (
                <div className="error" style={{ marginBottom: '1rem' }}>
                    ❌ {actionData.error}
                </div>
            )}

            {/* Show specific division if selected */}
            {selectedDivision ? (
                <DivisionStandingsTable
                    division={selectedDivision}
                    teams={standingsData[selectedDivision.id] || []}
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

            {/* Instructions */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h3 className="card-title">📋 How to Read the Standings</h3>
                </div>
                <div style={{ padding: '1rem' }}>
                    <p style={{ marginBottom: '1rem', color: 'var(--color-gray-600)' }}>
                        The standings table shows points breakdown by position. Each column represents the combined
                        points from players in those roster slots:
                    </p>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '0.5rem',
                            fontSize: 'var(--font-sm)',
                        }}
                    >
                        {POSITION_COLUMNS.map((col) => (
                            <div key={col.key} style={{ textAlign: 'center', padding: '0.5rem' }}>
                                <div style={{ fontWeight: 'var(--font-weight-semibold)', color: col.color }}>
                                    {col.label}
                                </div>
                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-gray-500)' }}>
                                    {col.key === 'gk' && '2 players'}
                                    {col.key === 'cb' && '2 players'}
                                    {col.key === 'fb' && '2 players'}
                                    {col.key === 'mid' && '2 players'}
                                    {col.key === 'wa' && '2 players'}
                                    {col.key === 'ca' && '2 players'}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '0.375rem',
                        }}
                    >
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'var(--font-weight-semibold)' }}>
                            📈 Gameweek Rank Changes
                        </p>
                        <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--color-gray-600)' }}>
                            In the gameweek table, each position shows points scored and rank movement. For example: "7
                            +2" means 7 points scored and moved up 2 positions in that category since last gameweek.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
