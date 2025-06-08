// app/routes/league-standings.tsx - Fixed to show separate division standings
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useActionData, Form, useSearchParams } from "react-router";
import { requestFormData } from '../lib/form-data';
import type { UserTeamData, DivisionData } from "../types";
import { SelectDivision } from '../components/select-division';
import { PageHeader } from '../components/page-header';

export const meta: MetaFunction = () => {
    return [
        { title: "League Standings - Fantasy Football Draft" },
        { name: "description", content: "View standings for each division in the fantasy football league" },
    ];
};

interface LoaderData {
    userTeamsByDivision: Record<string, UserTeamData[]>;
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

        // Dynamic import to keep server code on server
        const { getLeagueStandingsData } = await import("./server/league-standings.server");
        const loaderData = await getLeagueStandingsData(selectedDivision);

        return data<LoaderData>(loaderData);

    } catch (error) {
        console.error("League standings loader error:", error);
        throw new Response("Failed to load standings data", { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await requestFormData({ request, context });

        // Dynamic import to keep server code on server
        const { handleLeagueStandingsAction } = await import("./server/league-standings.server");
        const result = await handleLeagueStandingsAction(formData);

        return data<ActionData>(result);

    } catch (error) {
        console.error("League standings action error:", error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : "Failed to perform action"
        });
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

function DivisionStandingsTable({
                                    division,
                                    teams,
                                    showDivisionColumn = false
                                }: {
    division: DivisionData;
    teams: UserTeamData[];
    showDivisionColumn?: boolean;
}) {
    if (teams.length === 0) {
        return (
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h2 className="card-title">
                        📊 {division.label} Division
                    </h2>
                </div>
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>No Teams in Division</h3>
                    <p style={{ margin: 0 }}>
                        No teams have been added to the {division.label} division yet.
                    </p>
                </div>
            </div>
        );
    }

    // Calculate division stats
    const avgPoints = Math.round(teams.reduce((sum, team) => sum + team.totalPoints, 0) / teams.length);
    const topScore = teams[0]?.totalPoints || 0;
    const avgGwPoints = Math.round(teams.reduce((sum, team) => sum + team.currentGwPoints, 0) / teams.length);

    return (
        <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="card-title">
                        📊 {division.label} Division
                    </h2>
                    <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                        {teams.length} teams • Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>
                <Form method="post" style={{ float: 'right' }}>
                    <input type="hidden" name="actionType" value="refreshRankings" />
                    <input type="hidden" name="divisionId" value={division.id} />
                    <button type="submit" className="btn btn-secondary">
                        🔄 Refresh
                    </button>
                </Form>
            </div>

            {/* Division Summary Stats */}
            <div style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '1rem'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        {teams.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Teams</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                        {avgPoints.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Avg Points</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {topScore.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Top Score</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {avgGwPoints}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Avg GW</div>
                </div>
            </div>

            {/* Division Standings Table */}
            <div style={{ overflowX: 'auto' }}>
                <table className="table">
                    <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Team</th>
                        <th>Manager</th>
                        {showDivisionColumn && <th>Division</th>}
                        <th>Total Points</th>
                        <th>GW Points</th>
                        <th>Overall Rank</th>
                        <th>Last Updated</th>
                    </tr>
                    </thead>
                    <tbody>
                    {teams.map((team, index) => (
                        <tr key={team.userId} style={{
                            backgroundColor: index < 3 ? '#f0fdf4' : undefined
                        }}>
                            <td>
                                    <span style={getPositionStyle(index + 1)}>
                                        {index + 1 <= 3 ? getPositionIcon(index + 1) : index + 1}
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
                            {showDivisionColumn && (
                                <td>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            backgroundColor: '#dbeafe',
                                            color: '#1d4ed8',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '500'
                                        }}>
                                            {division.label}
                                        </span>
                                </td>
                            )}
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

            {/* Division Leaders */}
            {teams.length > 0 && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                }}>
                    {/* Division Leader */}
                    <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#10b981', fontSize: '0.875rem' }}>
                            🏆 Division Leader
                        </h4>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                            {teams[0].teamName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {teams[0].userName} • {teams[0].totalPoints?.toLocaleString()} pts
                        </div>
                    </div>

                    {/* Best GW Performance */}
                    <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#3b82f6', fontSize: '0.875rem' }}>
                            ⚡ Best GW Score
                        </h4>
                        {(() => {
                            const bestGwTeam = teams.reduce((best, team) =>
                                team.currentGwPoints > best.currentGwPoints ? team : best
                            );
                            return (
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                        {bestGwTeam.teamName}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        {bestGwTeam.userName} • {bestGwTeam.currentGwPoints} pts
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LeagueStandings() {
    const { userTeamsByDivision, divisions, selectedDivision } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const [searchParams, setSearchParams] = useSearchParams();

    const handleDivisionChange = (divisionId: string) => {
        if (divisionId === "all") {
            setSearchParams({});
        } else {
            setSearchParams({ division: divisionId });
        }
    };

    // Calculate overall stats
    const allTeams = Object.values(userTeamsByDivision).flat();
    const totalTeams = allTeams.length;
    const avgPoints = totalTeams > 0 ? Math.round(allTeams.reduce((sum, team) => sum + team.totalPoints, 0) / totalTeams) : 0;

    return (
        <div>
            <PageHeader
                title="League Standings"
                subTitle={`${divisions.length} divisions • ${totalTeams} total teams • ${avgPoints.toLocaleString()} avg points`}
                actions={
                    <SelectDivision
                        divisions={divisions}
                        selectedDivision={selectedDivision}
                        handleDivisionChange={handleDivisionChange}
                    />
                }
            />

            {/* Action Messages */}
            {actionData?.success && (
                <div className="success" style={{ marginBottom: '1rem' }}>
                    ✅ Rankings refreshed successfully!
                </div>
            )}

            {actionData?.error && (
                <div className="error" style={{ marginBottom: '1rem' }}>
                    ❌ {actionData.error}
                </div>
            )}

            {/* Show specific division if selected */}
            {selectedDivision ? (
                (() => {
                    const division = divisions.find(d => d.id === selectedDivision);
                    const teams = userTeamsByDivision[selectedDivision] || [];

                    if (!division) {
                        return (
                            <div className="error">
                                Division not found: {selectedDivision}
                            </div>
                        );
                    }

                    // Sort teams by total points for this division
                    const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

                    return (
                        <DivisionStandingsTable
                            division={division}
                            teams={sortedTeams}
                            showDivisionColumn={false}
                        />
                    );
                })()
            ) : (
                /* Show all divisions */
                <div>
                    {divisions.length === 0 ? (
                        <div className="card">
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>No Divisions Found</h3>
                                <p style={{ margin: 0 }}>
                                    No divisions have been created yet. Create divisions to organize your league standings.
                                </p>
                            </div>
                        </div>
                    ) : (
                        divisions
                            .sort((a, b) => a.order - b.order)
                            .map(division => {
                                const teams = userTeamsByDivision[division.id] || [];
                                // Sort teams by total points for this division
                                const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

                                return (
                                    <DivisionStandingsTable
                                        key={division.id}
                                        division={division}
                                        teams={sortedTeams}
                                        showDivisionColumn={false}
                                    />
                                );
                            })
                    )}
                </div>
            )}

            {/* Overall League Summary */}
            {!selectedDivision && totalTeams > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">
                            🌟 Overall League Summary
                        </h2>
                    </div>
                    <div style={{
                        padding: '1.5rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
                                {divisions.length}
                            </div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Divisions</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                Competing leagues
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
                                {totalTeams}
                            </div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Total Teams</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                Across all divisions
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '0.5rem' }}>
                                {avgPoints.toLocaleString()}
                            </div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Average Score</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                League-wide average
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
                                {totalTeams > 0 ? Math.max(...allTeams.map(t => t.totalPoints)).toLocaleString() : 0}
                            </div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Top Score</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                Best performing team
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
