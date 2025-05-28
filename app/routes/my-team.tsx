import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useActionData, Form, useSearchParams } from "react-router";
import { readUserTeams, getUserTeamsByDivision } from "../lib/sheets/userTeams";
import { readDivisions } from "../lib/sheets/divisions";
import type { UserTeamData, DivisionData } from "../types";
import { SelectDivision } from '../components/select-division';

export const meta: MetaFunction = () => {
    return [
        { title: "My Team - Fantasy Football Draft" },
        { name: "description", content: "Manage your fantasy football team and view league standings" },
    ];
};

interface LoaderData {
    userTeams: UserTeamData[];
    divisions: DivisionData[];
    selectedDivision?: string;
}

interface ActionData {
    success?: boolean;
    error?: string;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const url = new URL(request.url);
        const selectedDivision = url.searchParams.get("division");

        // Fetch data in parallel
        const [userTeams, divisions] = await Promise.all([
            selectedDivision
                ? getUserTeamsByDivision(selectedDivision)
                : readUserTeams(),
            readDivisions()
        ]);

        // Sort teams by league rank
        const sortedTeams = userTeams.sort((a, b) => a.leagueRank - b.leagueRank);

        return data<LoaderData>({
            userTeams: sortedTeams,
            divisions,
            selectedDivision: selectedDivision || undefined
        });

    } catch (error) {
        console.error("My team loader error:", error);
        throw new Response("Failed to load team data", { status: 500 });
    }
}

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await request.formData();
        const actionType = formData.get("actionType");

        switch (actionType) {
            case "refreshRankings":
                // This would trigger a recalculation of league rankings
                // Implementation would depend on your specific ranking logic
                return data<ActionData>({ success: true });

            default:
                return data<ActionData>({ error: "Invalid action type" });
        }

    } catch (error) {
        console.error("My team action error:", error);
        return data<ActionData>({ error: "Failed to perform action" });
    }
}



const getPositionIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
};

const getPositionStyle = (rank: number) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    backgroundColor: rank <= 3 ? '#fbbf24' : rank <= 10 ? '#10b981' : '#6b7280',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600'
});

export default function MyTeam() {
    const { userTeams, divisions, selectedDivision } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const [searchParams, setSearchParams] = useSearchParams();

    const handleDivisionChange = (divisionId: string) => {
        if (divisionId === "all") {
            setSearchParams({});
        } else {
            setSearchParams({ division: divisionId });
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    League Standings
                </h1>
                <SelectDivision divisions={divisions} selectedDivision={selectedDivision} handleDivisionChange={handleDivisionChange} />
            </div>

            {/* Action Messages */}
            {actionData?.success && (
                <div className="success">
                    ✅ Action completed successfully!
                </div>
            )}

            {actionData?.error && (
                <div className="error">
                    ❌ {actionData.error}
                </div>
            )}

            {/* Division Summary */}
            {selectedDivision && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontWeight: '600' }}>
                        {divisions.find(d => d.id === selectedDivision)?.label} Division
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                {userTeams.length}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Teams</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                {userTeams.length > 0 ? Math.round(userTeams.reduce((sum, team) => sum + team.totalPoints, 0) / userTeams.length)?.toLocaleString() : 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Avg Points</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                                {userTeams.length > 0 ? userTeams[0].totalPoints?.toLocaleString() : 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Top Score</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                {userTeams.length > 0 ? Math.round(userTeams.reduce((sum, team) => sum + team.currentGwPoints, 0) / userTeams.length) : 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Avg GW</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Standings */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                    <h2 className="card-title">
                        📊 League Standings
                        {selectedDivision && ` - ${divisions.find(d => d.id === selectedDivision)?.label}`}
                    </h2>
                    <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                        {userTeams.length} teams • Last updated: {new Date().toLocaleDateString()}
                    </p>
                    </div>
                    <Form method="post" style={{ float: 'right' }}>
                        <input type="hidden" name="actionType" value="refreshRankings" />
                        <button type="submit" className="btn btn-secondary">
                            🔄 Refresh Rankings
                        </button>
                    </Form>
                </div>

                {userTeams.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>No Teams Found</h3>
                        <p style={{ margin: 0 }}>
                            {selectedDivision
                                ? "No teams in this division yet."
                                : "No teams have been added to the league yet."
                            }
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Team</th>
                                <th>Manager</th>
                                <th>Division</th>
                                <th>Total Points</th>
                                <th>GW Points</th>
                                <th>Overall Rank</th>
                                <th>Last Updated</th>
                            </tr>
                            </thead>
                            <tbody>
                            {userTeams.map((team, index) => (
                                <tr key={team.userId} style={{
                                    backgroundColor: index < 3 ? '#f0fdf4' : undefined
                                }}>
                                    <td>
                      <span style={getPositionStyle(team.leagueRank)}>
                        {team.leagueRank <= 3 ? getPositionIcon(team.leagueRank) : team.leagueRank}
                      </span>
                                    </td>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                                {team.teamName}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                FPL ID: {team.fplId}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '500' }}>
                                        {team.userName}
                                    </td>
                                    <td>
                      <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dbeafe',
                          color: '#1d4ed8',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                      }}>
                        {divisions.find(d => d.id === team.divisionId)?.label || team.divisionId}
                      </span>
                                    </td>
                                    <td style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                                        {team.totalPoints?.toLocaleString()}
                                    </td>
                                    <td style={{
                                        color: team.currentGwPoints > 50 ? '#059669' : team.currentGwPoints > 30 ? '#0891b2' : '#6b7280',
                                        fontWeight: '500'
                                    }}>
                                        {team.currentGwPoints}
                                    </td>
                                    <td style={{ color: '#6b7280' }}>
                                        #{team.overallRank?.toLocaleString()}
                                    </td>
                                    <td style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        {new Date(team.lastUpdated).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            {userTeams.length > 0 && (
                <div style={{
                    marginTop: '2rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem'
                }}>
                    {/* Top Performer */}
                    <div className="card">
                        <h3 style={{ margin: '0 0 1rem 0', fontWeight: '600', color: '#10b981' }}>
                            🏆 Division Leader
                        </h3>
                        {userTeams[0] && (
                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                    {userTeams[0].teamName}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                    {userTeams[0].userName}
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                                    {userTeams[0].totalPoints?.toLocaleString()} points
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Best GW Performance */}
                    <div className="card">
                        <h3 style={{ margin: '0 0 1rem 0', fontWeight: '600', color: '#3b82f6' }}>
                            ⚡ Best GW Score
                        </h3>
                        {(() => {
                            const bestGwTeam = userTeams.reduce((best, team) =>
                                team.currentGwPoints > best.currentGwPoints ? team : best
                            );
                            return (
                                <div>
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                        {bestGwTeam.teamName}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                        {bestGwTeam.userName}
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                        {bestGwTeam.currentGwPoints} points
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Average Performance */}
                    <div className="card">
                        <h3 style={{ margin: '0 0 1rem 0', fontWeight: '600', color: '#8b5cf6' }}>
                            📈 League Average
                        </h3>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '0.5rem' }}>
                                {Math.round(userTeams.reduce((sum, team) => sum + team.totalPoints, 0) / userTeams.length)?.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                Total Points Average
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                GW Avg: {Math.round(userTeams.reduce((sum, team) => sum + team.currentGwPoints, 0) / userTeams.length)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
