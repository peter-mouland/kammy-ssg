import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData } from "react-router";
import { fplApi } from "./server/fpl/api";
import { getPlayerGameweekStats, getPlayerSeasonStats } from "./server/sheets/playerStats";
import { calculateGameweekPoints, getPositionDisplayName, getPositionColor, formatPointsDisplay } from "../lib/points";
import type { FplPlayerData, PlayerGameweekStatsData, PlayerSeasonStatsData, PointsBreakdown, CustomPosition } from "../types";


export const meta: MetaFunction<typeof loader> = ({ data }) => {
    const playerName = data?.player ? `${data.player.first_name} ${data.player.second_name}` : "Player";
    return [
        { title: `${playerName} - Fantasy Football Draft` },
        { name: "description", content: `Detailed stats and performance analysis for ${playerName}` },
    ];
};

interface LoaderData {
    player: FplPlayerData;
    gameweekStats: PlayerGameweekStatsData[];
    seasonStats: PlayerSeasonStatsData | null;
    customPoints: PointsBreakdown[];
    position: CustomPosition;
}

export async function loader({ params }: LoaderFunctionArgs): Promise<Response> {
    try {
        const playerId = parseInt(params.playerId || "1");

        if (isNaN(playerId)) {
            throw new Response("Invalid player ID", { status: 400 });
        }

        // Fetch player data in parallel
        const [player, playerDetail, gameweekStats, seasonStats] = await Promise.all([
            fplApi.getFplPlayer(playerId),
            fplApi.getPlayerDetailedStats(playerId),
            getPlayerGameweekStats(playerId.toString()),
            getPlayerSeasonStats(playerId.toString(), "2024-25")
        ]);

        if (!player) {
            throw new Response("Player not found", { status: 404 });
        }

        // Map FPL position to custom position (simplified mapping)
        const position: CustomPosition = player.element_type === 1 ? 'gk' :
            player.element_type === 2 ? 'fb' :
                player.element_type === 3 ? 'mid' : 'ca';

        // Calculate custom points for each gameweek
        const customPoints: PointsBreakdown[] = gameweekStats.map(stats =>
            calculateGameweekPoints(stats, position)
        );

        return data<LoaderData>({
            player,
            gameweekStats,
            seasonStats,
            customPoints,
            position
        });

    } catch (error) {
        console.error("Player detail loader error:", error);

        if (error instanceof Response) {
            throw error;
        }

        throw new Response("Failed to load player data", { status: 500 });
    }
}

export default function PlayerDetail() {
    const { player, gameweekStats, seasonStats, customPoints, position } = useLoaderData<typeof loader>();

    const positionColor = getPositionColor(position);
    const positionName = getPositionDisplayName(position);

    // Calculate totals
    const totalCustomPoints = customPoints.reduce((sum, points) => sum + points.total, 0);
    const averageCustomPoints = gameweekStats.length > 0 ? Math.round((totalCustomPoints / gameweekStats.length) * 10) / 10 : 0;

    const getPointsColor = (points: number) => {
        if (points > 0) return '#10b981';
        if (points < 0) return '#ef4444';
        return '#6b7280';
    };

    return (
        <div>
            {/* Player Header */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {player.first_name} {player.second_name}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span
                  style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: positionColor,
                      color: 'white',
                      borderRadius: '0.375rem',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                  }}
              >
                {positionName}
              </span>
                            <span style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                Team {player.team}
              </span>
                            <span style={{ color: '#059669', fontSize: '1.125rem', fontWeight: '600' }}>
                £{(player.now_cost / 10).toFixed(1)}m
              </span>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                            {player.total_points}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            FPL Points
                        </div>
                    </div>
                </div>
            </div>

            {/* Season Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
                        {totalCustomPoints}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Custom Points
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
                        {averageCustomPoints}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Avg Per Game
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '0.5rem' }}>
                        {seasonStats?.gamesPlayed || gameweekStats.length}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Games Played
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
                        {seasonStats?.totalMinutes || gameweekStats.reduce((sum, stats) => sum + stats.minutesPlayed, 0)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Total Minutes
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
                        {seasonStats?.goals || gameweekStats.reduce((sum, stats) => sum + stats.goals, 0)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Goals
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
                        {seasonStats?.assists || gameweekStats.reduce((sum, stats) => sum + stats.assists, 0)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Assists
                    </div>
                </div>
            </div>

            {/* Gameweek Performance Table */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Gameweek Performance</h2>
                    <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                        Click any row to see detailed points breakdown
                    </p>
                </div>

                {gameweekStats.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>No Performance Data</h3>
                        <p style={{ margin: 0 }}>
                            No gameweek statistics available for this player yet.
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>GW</th>
                                <th>Minutes</th>
                                <th>Goals</th>
                                <th>Assists</th>
                                <th>Clean Sheets</th>
                                <th>Cards</th>
                                <th>Custom Points</th>
                                <th>FPL Points</th>
                            </tr>
                            </thead>
                            <tbody>
                            {gameweekStats.map((stats, index) => {
                                const customPointsBreakdown = customPoints[index];
                                return (
                                    <tr
                                        key={stats.gameweek}
                                        style={{ cursor: 'pointer' }}
                                        title="Click for detailed breakdown"
                                    >
                                        <td style={{ fontWeight: '600' }}>
                                            {stats.gameweek}
                                        </td>
                                        <td>
                                            {stats.minutesPlayed}'
                                        </td>
                                        <td style={{ color: stats.goals > 0 ? '#10b981' : undefined }}>
                                            {stats.goals}
                                        </td>
                                        <td style={{ color: stats.assists > 0 ? '#3b82f6' : undefined }}>
                                            {stats.assists}
                                        </td>
                                        <td style={{ color: stats.cleanSheets > 0 ? '#10b981' : undefined }}>
                                            {stats.cleanSheets}
                                        </td>
                                        <td>
                                            {stats.yellowCards > 0 && (
                                                <span style={{ color: '#f59e0b', marginRight: '0.25rem' }}>
                            {stats.yellowCards}🟨
                          </span>
                                            )}
                                            {stats.redCards > 0 && (
                                                <span style={{ color: '#ef4444' }}>
                            {stats.redCards}🟥
                          </span>
                                            )}
                                            {stats.yellowCards === 0 && stats.redCards === 0 && '-'}
                                        </td>
                                        <td style={{
                                            fontWeight: '600',
                                            color: getPointsColor(customPointsBreakdown?.total || 0)
                                        }}>
                                            {formatPointsDisplay(customPointsBreakdown?.total || 0)}
                                        </td>
                                        <td style={{ color: '#6b7280' }}>
                                            {stats.bonus || 0}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Points Breakdown Example */}
            {customPoints.length > 0 && (
                <div className="card" style={{ marginTop: '2rem' }}>
                    <div className="card-header">
                        <h2 className="card-title">Custom Points Breakdown</h2>
                        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                            Example from Gameweek {gameweekStats[gameweekStats.length - 1]?.gameweek}
                        </p>
                    </div>

                    {(() => {
                        const latestBreakdown = customPoints[customPoints.length - 1];
                        if (!latestBreakdown) return null;

                        return (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold',
                                        color: getPointsColor(latestBreakdown.appearance),
                                        marginBottom: '0.25rem'
                                    }}>
                                        {formatPointsDisplay(latestBreakdown.appearance)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Appearance</div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold',
                                        color: getPointsColor(latestBreakdown.goals),
                                        marginBottom: '0.25rem'
                                    }}>
                                        {formatPointsDisplay(latestBreakdown.goals)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Goals</div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold',
                                        color: getPointsColor(latestBreakdown.assists),
                                        marginBottom: '0.25rem'
                                    }}>
                                        {formatPointsDisplay(latestBreakdown.assists)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Assists</div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold',
                                        color: getPointsColor(latestBreakdown.cleanSheets),
                                        marginBottom: '0.25rem'
                                    }}>
                                        {formatPointsDisplay(latestBreakdown.cleanSheets)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Clean Sheets</div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold',
                                        color: getPointsColor(latestBreakdown.yellowCards + latestBreakdown.redCards),
                                        marginBottom: '0.25rem'
                                    }}>
                                        {formatPointsDisplay(latestBreakdown.yellowCards + latestBreakdown.redCards)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Cards</div>
                                </div>

                                {position === 'gk' && (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 'bold',
                                            color: getPointsColor(latestBreakdown.saves),
                                            marginBottom: '0.25rem'
                                        }}>
                                            {formatPointsDisplay(latestBreakdown.saves)}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Saves</div>
                                    </div>
                                )}

                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        color: getPointsColor(latestBreakdown.total),
                                        marginBottom: '0.25rem',
                                        padding: '0.5rem',
                                        border: '2px solid',
                                        borderColor: getPointsColor(latestBreakdown.total),
                                        borderRadius: '0.375rem'
                                    }}>
                                        {formatPointsDisplay(latestBreakdown.total)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>TOTAL</div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
