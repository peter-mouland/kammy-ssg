import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, Link } from "react-router";
import { getFplBootstrapData, getTopPerformers } from "../lib/fpl/api";
import { readUserTeams, getUserTeamsOrderedByRank } from "../lib/sheets/userTeams";
import { readDivisions } from "../lib/sheets/divisions";
import { Icon, TextIcon } from "../components/icon";
import type { UserTeamData, DivisionData, FplPlayerData } from "../types";

export const meta: MetaFunction = () => {
    return [
        { title: "Dashboard - Fantasy Football Draft" },
        { name: "description", content: "Fantasy football league dashboard with top players and standings" },
    ];
};

interface LoaderData {
    topPlayers: FplPlayerData[];
    leagueStandings: UserTeamData[];
    divisions: DivisionData[];
    currentGameweek: number;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {

        // Fetch data in parallel
        const [
            bootstrapData,
            topPlayers,
            userTeams,
            divisions
        ] = await Promise.all([
            getFplBootstrapData(),
            getTopPerformers(20),
            readUserTeams(),
            readDivisions()
        ]);

        // Get current gameweek
        const currentGameweek = bootstrapData.events.find(event => event.is_current)?.id || 1;

        // Get league standings (top 10)
        const leagueStandings = userTeams
            .sort((a, b) => a.leagueRank - b.leagueRank)
            .slice(0, 10);

        return data<LoaderData>({
            topPlayers,
            leagueStandings,
            divisions,
            currentGameweek
        });

    } catch (error) {
        console.error("Dashboard loader error:", error);
        throw new Response("Failed to load dashboard data", { status: 500 });
    }
}

export default function Dashboard() {
    const { topPlayers, leagueStandings, divisions, currentGameweek } = useLoaderData<typeof loader>();

    return (
        <div>
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Fantasy Football Draft Dashboard
                </h1>
                <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                    Gameweek {currentGameweek} • {divisions.length} Divisions • {leagueStandings.length}+ Teams
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Top FPL Players */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <Icon type="trophy" /> Top FPL Players
                        </h2>
                        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                            Best performing players this season
                        </p>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>Player</th>
                                <th>Team</th>
                                <th>Points</th>
                                <th>Price</th>
                            </tr>
                            </thead>
                            <tbody>
                            {topPlayers.slice(0, 10).map((player, index) => (
                                <tr key={player.id}>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>
                                                {player.first_name} {player.second_name}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                #{index + 1}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.875rem' }}>
                                        Team {player.team}
                                    </td>
                                    <td style={{ fontWeight: '600' }}>
                                        {player.total_points}
                                    </td>
                                    <td style={{ color: '#059669' }}>
                                        £{(player.now_cost / 10).toFixed(1)}m
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <Link to="/players" className="btn btn-secondary">
                            View All Players
                        </Link>
                    </div>
                </div>

                {/* League Standings */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <Icon type="chart" /> League Standings
                        </h2>
                        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                            Top teams across all divisions
                        </p>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Team</th>
                                <th>Manager</th>
                                <th>Points</th>
                            </tr>
                            </thead>
                            <tbody>
                            {leagueStandings.map((team) => (
                                <tr key={team.userId}>
                                    <td>
                      <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          backgroundColor: team.leagueRank <= 3 ? '#fbbf24' : '#e5e7eb',
                          color: team.leagueRank <= 3 ? 'white' : '#374151',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                      }}>
                        {team.leagueRank}
                      </span>
                                    </td>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>
                                                {team.teamName}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                Division {team.divisionId}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.875rem' }}>
                                        {team.userName}
                                    </td>
                                    <td style={{ fontWeight: '600' }}>
                                        {team.totalPoints?.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <Link to="/my-team" className="btn btn-secondary">
                            View Full Standings
                        </Link>
                    </div>
                </div>

                {/* Division Overview */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <Icon type="team" /> Divisions
                        </h2>
                        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                            League division breakdown
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {divisions.map((division) => {
                            const divisionTeams = leagueStandings.filter(team => team.divisionId === division.id);
                            const averagePoints = divisionTeams.length > 0
                                ? Math.round(divisionTeams.reduce((sum, team) => sum + team.totalPoints, 0) / divisionTeams.length)
                                : 0;

                            return (
                                <div key={division.id} style={{
                                    padding: '1rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.375rem',
                                    backgroundColor: '#f9fafb'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontWeight: '600' }}>
                                            {division.label}
                                        </h3>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: '#dbeafe',
                                            color: '#1d4ed8',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500'
                                        }}>
                      {divisionTeams.length} teams
                    </span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        Average: {averagePoints.toLocaleString()} points
                                    </div>
                                    {divisionTeams.length > 0 && (
                                        <div style={{ fontSize: '0.875rem', color: '#059669', marginTop: '0.25rem' }}>
                                            Leader: {divisionTeams[0]?.teamName} ({divisionTeams[0]?.totalPoints?.toLocaleString()} pts)
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <Link to="/my-team" className="btn btn-secondary">
                            Manage Teams
                        </Link>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">⚡ Quick Actions</h2>
                        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                            Common tasks and shortcuts
                        </p>
                    </div>
                    <Link to="/draft" className="btn btn-primary">
                        🎯 Join Draft Room
                    </Link>
                    <Link to="/generate-draft" className="btn btn-secondary">
                        ⚙️ Draft Setup
                    </Link>
                    <Link to="/my-team" className="btn btn-secondary">
                        👥 Team Management
                    </Link>
                    <Link to="/player/1" className="btn btn-secondary">
                        📊 Player Stats
                    </Link>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">📈 Recent Activity</h2>
                    <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                        Latest updates and changes
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '0.375rem', borderLeft: '3px solid #0ea5e9' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>Gameweek {currentGameweek} Started</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            New player stats available
                        </div>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.375rem', borderLeft: '3px solid #10b981' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>League Updated</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            Rankings refreshed for all divisions
                        </div>
                    </div>

                    {divisions.length > 0 && (
                        <div style={{ padding: '0.75rem', backgroundColor: '#fefce8', borderRadius: '0.375rem', borderLeft: '3px solid #eab308' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>Draft Available</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                {divisions.length} divisions ready for drafting
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* System Status */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">🟢 System Status</h2>
                    <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                        All systems operational
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem' }}>FPL API</span>
                        <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '500' }}>
                ✓ Connected
              </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem' }}>Google Sheets</span>
                        <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '500' }}>
                ✓ Synced
              </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem' }}>Live Updates</span>
                        <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '500' }}>
                ✓ Active
              </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem' }}>Draft System</span>
                        <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '500' }}>
                ✓ Ready
              </span>
                    </div>
                </div>
            </div>
        </div>

    {/* Footer Stats */}
    <div style={{
        marginTop: '3rem',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
    }}>
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem'
        }}>
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                    {leagueStandings.length}+
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Active Teams
                </div>
            </div>

            <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                    {divisions.length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Divisions
                </div>
            </div>

            <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                    {currentGameweek}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Current Gameweek
                </div>
            </div>

            <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                    {topPlayers.length}+
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Players Available
                </div>
            </div>
        </div>
    </div>
</div>
);
}
