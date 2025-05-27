import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useActionData, Form } from "react-router";
import { createSheetsClient } from "../lib/sheets/common";
import { readDivisions } from "../lib/sheets/divisions";
import { getUserTeamsByDivision } from "../lib/sheets/userTeams";
import {
    generateRandomDraftOrder,
    getDraftOrderByDivision,
    clearDraftOrder,
    draftOrderExists
} from "../lib/sheets/draftOrder";
import { updateDraftState, readDraftState } from "../lib/sheets/draft";
import type { DivisionData, UserTeamData, DraftOrderData, DraftStateData } from "../types";

export const meta: MetaFunction = () => {
    return [
        { title: "Draft Setup - Fantasy Football Draft" },
        { name: "description", content: "Generate and manage draft orders for fantasy football league" },
    ];
};

interface LoaderData {
    divisions: DivisionData[];
    draftOrders: Record<string, DraftOrderData[]>;
    userTeamsByDivision: Record<string, UserTeamData[]>;
    draftState: DraftStateData | null;
}

interface ActionData {
    success?: boolean;
    error?: string;
    message?: string;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        // Fetch divisions and draft state
        const [divisions, draftState] = await Promise.all([
            readDivisions(),
            readDraftState()
        ]);

        // Fetch user teams and draft orders for each division
        const draftOrders: Record<string, DraftOrderData[]> = {};
        const userTeamsByDivision: Record<string, UserTeamData[]> = {};

        await Promise.all(
            divisions.map(async (division) => {
                const [teams, orders] = await Promise.all([
                    getUserTeamsByDivision(division.id),
                    getDraftOrderByDivision(division.id)
                ]);

                userTeamsByDivision[division.id] = teams;
                draftOrders[division.id] = orders;
            })
        );

        return data<LoaderData>({
            divisions,
            draftOrders,
            userTeamsByDivision,
            draftState
        });

    } catch (error) {
        console.error("Generate draft loader error:", error);
        throw new Response("Failed to load draft setup data", { status: 500 });
    }
}

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await request.formData();
        const actionType = formData.get("actionType");
        const divisionId = formData.get("divisionId")?.toString();

        switch (actionType) {
            case "generateOrder":
                if (!divisionId) {
                    return data<ActionData>({ error: "Division ID is required" });
                }

                // Get user teams for the division
                const userTeams = await getUserTeamsByDivision(divisionId);

                if (userTeams.length === 0) {
                    return data<ActionData>({ error: "No teams found in this division" });
                }

                // Generate random draft order
                const teamData = userTeams.map(team => ({
                    userId: team.userId,
                    userName: team.userName
                }));

                await generateRandomDraftOrder(divisionId, teamData);

                return data<ActionData>({
                    success: true,
                    message: `Draft order generated for division ${divisionId}`
                });

            case "clearOrder":
                if (!divisionId) {
                    return data<ActionData>({ error: "Division ID is required" });
                }

                await clearDraftOrder(divisionId);

                return data<ActionData>({
                    success: true,
                    message: `Draft order cleared for division ${divisionId}`
                });

            case "startDraft":
                const selectedDivisionId = formData.get("selectedDivisionId")?.toString();
                const totalRounds = parseInt(formData.get("totalRounds")?.toString() || "15");

                if (!selectedDivisionId) {
                    return data<ActionData>({ error: "Please select a division to start the draft" });
                }

                // Check if draft order exists for the division
                const orderExists = await draftOrderExists(selectedDivisionId);
                if (!orderExists) {
                    return data<ActionData>({ error: "Draft order must be generated before starting the draft" });
                }

                // Get the draft order to determine first user
                const draftOrder = await getDraftOrderByDivision(selectedDivisionId);
                const firstUser = draftOrder.find(order => order.position === 1);

                if (!firstUser) {
                    return data<ActionData>({ error: "No users found in draft order" });
                }

                // Create new draft state
                const newDraftState: DraftStateData = {
                    isActive: true,
                    currentPick: 1,
                    currentUserId: firstUser.userId,
                    currentDivisionId: selectedDivisionId,
                    totalRounds,
                    picksPerTeam: totalRounds,
                    startedAt: new Date(),
                    completedAt: null
                };

                await updateDraftState(newDraftState);

                return data<ActionData>({
                    success: true,
                    message: `Draft started for division ${selectedDivisionId}!`
                });

            case "stopDraft":
                // Get current draft state
                const currentDraftState = await readDraftState();

                if (!currentDraftState?.isActive) {
                    return data<ActionData>({ error: "No active draft to stop" });
                }

                // Stop the draft
                const stoppedDraftState: DraftStateData = {
                    ...currentDraftState,
                    isActive: false,
                    completedAt: new Date()
                };

                await updateDraftState(stoppedDraftState);

                return data<ActionData>({
                    success: true,
                    message: "Draft stopped successfully"
                });

            default:
                return data<ActionData>({ error: "Invalid action type" });
        }

    } catch (error) {
        console.error("Generate draft action error:", error);
        return data<ActionData>({ error: "Failed to perform draft action" });
    }
}

export default function GenerateDraft() {
    const { divisions, draftOrders, userTeamsByDivision, draftState } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();

    const getDivisionStatus = (divisionId: string) => {
        const teams = userTeamsByDivision[divisionId] || [];
        const orders = draftOrders[divisionId] || [];

        if (teams.length === 0) return { status: "No Teams", color: "#6b7280" };
        if (orders.length === 0) return { status: "Ready to Generate", color: "#f59e0b" };
        return { status: "Order Generated", color: "#10b981" };
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Draft Setup & Management
                </h1>
                <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                    Generate draft orders and manage the draft process
                </p>
            </div>

            {/* Action Messages */}
            {actionData?.success && (
                <div className="success">
                    ✅ {actionData.message}
                </div>
            )}

            {actionData?.error && (
                <div className="error">
                    ❌ {actionData.error}
                </div>
            )}

            {/* Draft Status */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h2 className="card-title">Current Draft Status</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Status
                        </div>
                        <div style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: draftState?.isActive ? '#10b981' : '#6b7280'
                        }}>
                            {draftState?.isActive ? '🟢 Active' : '🔴 Inactive'}
                        </div>
                    </div>

                    {draftState?.isActive && (
                        <>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                    Active Division
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                                    {divisions.find(d => d.id === draftState.currentDivisionId)?.label || 'Unknown'}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                    Current Pick
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                                    #{draftState.currentPick}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                    Total Rounds
                                </div>
                                <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                                    {draftState.totalRounds}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {draftState?.isActive && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem' }}>
                        <Form method="post" style={{ display: 'inline' }}>
                            <input type="hidden" name="actionType" value="stopDraft" />
                            <button
                                type="submit"
                                className="btn btn-danger"
                                onClick={(e) => !confirm("Are you sure you want to stop the active draft?") && e.preventDefault()}
                            >
                                🛑 Stop Current Draft
                            </button>
                        </Form>
                    </div>
                )}
            </div>

            {/* Division Management */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                    <h2 className="card-title">Division Draft Orders</h2>
                    <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                        Generate and manage draft orders for each division
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {divisions.map((division) => {
                        const teams = userTeamsByDivision[division.id] || [];
                        const orders = draftOrders[division.id] || [];
                        const divisionStatus = getDivisionStatus(division.id);

                        return (
                            <div
                                key={division.id}
                                style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    padding: '1.5rem',
                                    backgroundColor: '#f9fafb'
                                }}
                            >
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontWeight: '600', lineHeight: 1 }}>
                                            {division.label}
                                        </h3>
                                        <span
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                backgroundColor: divisionStatus.color,
                                                color: 'white',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: '500'
                                            }}
                                        >
                      {divisionStatus.status}
                    </span>
                                    </div>

                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        {teams.length} teams {orders.length > 0 ? '' : ' • No order yet'}
                                    </div>
                                </div>

                                {/* Draft Order */}
                                {orders.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                                            Draft Order:
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {orders.map((order) => (
                                                <div key={order.userId} style={{ fontSize: '0.875rem' }}>
                                                    <span style={{ fontWeight: '600' }}>#{order.position}</span> {order.userName}
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                            Generated: {new Date(orders[0]?.generatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {teams.length > 0 && (
                                        <Form method="post" style={{ display: 'inline' }}>
                                            <input type="hidden" name="actionType" value={orders.length > 0 ? "regenerateOrder" : "generateOrder"} />
                                            <input type="hidden" name="divisionId" value={division.id} />
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                style={{ fontSize: '0.875rem' }}
                                                disabled={draftState?.isActive}
                                            >
                                                {orders.length > 0 ? '🔄 Regenerate' : '🎲 Generate'} Order
                                            </button>
                                        </Form>
                                    )}

                                    {orders.length > 0 && (
                                        <Form method="post" style={{ display: 'inline' }}>
                                            <input type="hidden" name="actionType" value="clearOrder" />
                                            <input type="hidden" name="divisionId" value={division.id} />
                                            <button
                                                type="submit"
                                                className="btn btn-secondary"
                                                style={{ fontSize: '0.875rem' }}
                                                disabled={draftState?.isActive}
                                                onClick={(e) => !confirm("Are you sure you want to clear this draft order?") && e.preventDefault()}
                                            >
                                                🗑️ Clear Order
                                            </button>
                                        </Form>
                                    )}
                                </div>

                                {teams.length === 0 && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '1rem',
                                        color: '#6b7280',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '0.375rem'
                                    }}>
                                        No teams in this division yet
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Start Draft */}
            {!draftState?.isActive && (
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Start New Draft</h2>
                        <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                            Begin the draft process for a specific division
                        </p>
                    </div>

                    <Form method="post">
                        <input type="hidden" name="actionType" value="startDraft" />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label htmlFor="selectedDivisionId" style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                                    Select Division:
                                </label>
                                <select
                                    id="selectedDivisionId"
                                    name="selectedDivisionId"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value="">Choose a division...</option>
                                    {divisions.map((division) => {
                                        const orders = draftOrders[division.id] || [];
                                        const teams = userTeamsByDivision[division.id] || [];
                                        const isReady = orders.length > 0 && teams.length > 0;

                                        return (
                                            <option
                                                key={division.id}
                                                value={division.id}
                                                disabled={!isReady}
                                            >
                                                {division.label} {!isReady ? '(Not Ready)' : `(${teams.length} teams)`}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="totalRounds" style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                                    Total Rounds:
                                </label>
                                <select
                                    id="totalRounds"
                                    name="totalRounds"
                                    defaultValue="15"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <option value="10">10 Rounds</option>
                                    <option value="12">12 Rounds</option>
                                    <option value="15">15 Rounds</option>
                                    <option value="18">18 Rounds</option>
                                    <option value="20">20 Rounds</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary">
                            🚀 Start Draft
                        </button>
                    </Form>

                    {/* Draft Instructions */}
                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '0.375rem'
                    }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1d4ed8', fontWeight: '600' }}>
                            📝 Draft Instructions
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e40af' }}>
                            <li>Ensure all divisions have teams assigned before generating draft orders</li>
                            <li>Draft orders must be generated before starting a draft</li>
                            <li>Only one draft can be active at a time</li>
                            <li>Draft follows snake format: even rounds reverse the order</li>
                            <li>Players can only be drafted once across all divisions</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div style={{
                marginTop: '3rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
            }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
                        {divisions.length}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Total Divisions
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
                        {Object.values(draftOrders).filter(orders => orders.length > 0).length}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Orders Generated
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '0.5rem' }}>
                        {Object.values(userTeamsByDivision).reduce((total, teams) => total + teams.length, 0)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Total Teams
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
                        {divisions.filter(div => {
                            const teams = userTeamsByDivision[div.id] || [];
                            const orders = draftOrders[div.id] || [];
                            return teams.length > 0 && orders.length > 0;
                        }).length}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Ready to Draft
                    </div>
                </div>
            </div>
        </div>
    );
}
