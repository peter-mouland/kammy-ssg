import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useActionData, Form } from "react-router";
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
                if (!divisionId) {
                    return data<ActionData>({ error: "Please select a division to start the draft" });
                }

                // Check if draft order exists for the division
                const orderExists = await draftOrderExists(divisionId);
                if (!orderExists) {
                    return data<ActionData>({ error: "Draft order must be generated before starting the draft" });
                }

                // Get the draft order to determine first user
                const draftOrder = await getDraftOrderByDivision(divisionId);
                const firstUser = draftOrder.find(order => order.position === 1);

                if (!firstUser) {
                    return data<ActionData>({ error: "No users found in draft order" });
                }

                // Create new draft state
                const newDraftState: DraftStateData = {
                    isActive: true,
                    currentPick: 1,
                    currentUserId: firstUser.userId,
                    currentDivisionId: divisionId,
                    picksPerTeam: 12,
                    startedAt: new Date(),
                    completedAt: null
                };

                await updateDraftState(newDraftState);

                return data<ActionData>({
                    success: true,
                    message: `Draft started for division ${divisionId}!`
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
                return data<ActionData>({ error: "Invalid action type: " + actionType });
        }

    } catch (error) {
        console.error("Generate draft action error:", error);
        return data<ActionData>({ error: "Failed to perform draft action" });
    }
}

export default function DraftAdmin() {
    const { divisions, draftOrders, userTeamsByDivision, draftState } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();

    const getDivisionStatus = (divisionId: string, isActive: boolean, hasActive: boolean) => {
        const teams = userTeamsByDivision[divisionId] || [];
        const orders = draftOrders[divisionId] || [];

        if (teams.length === 0) return { status: "No Teams", color: "#6b7280", disabled: true };
        if (orders.length === 0) return { status: "🎲 Generate Order", color: "#f59e0b", disabled: false, action: "generateOrder" };
        if (isActive) return { status: "🛑 Stop Draft", color: "red", disabled: false, action: "stopDraft" };
        if (hasActive) return { status: "⚪️ Start Draft", color: "#6b7280", disabled: true, action: "StartDraft" };
        return { status: "🟢 Start Draft", color: "#10b981", disabled: false, action: "startDraft" };
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Draft Setup
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

            {/* Division Management */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {divisions.map((division) => {
                    const teams = userTeamsByDivision[division.id] || [];
                    const orders = draftOrders[division.id] || [];
                    const isActive = draftState?.isActive && draftState.currentDivisionId === division.id
                    const divisionStatus = getDivisionStatus(division.id, isActive, draftState?.isActive);

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
                                        {draftState?.isActive && draftState.currentDivisionId === division.id ? '🟢 ' : ''}

                                        {division.label}
                                    </h3>
                                    <Form method="post" style={{ display: 'inline' }}>
                                        <input type="hidden" name="divisionId" value={division.id} />
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            name={"actionType"}
                                            value={divisionStatus.action}
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.875rem',
                                                backgroundColor: divisionStatus.color }}
                                            disabled={divisionStatus.disabled}
                                        >
                                            {divisionStatus.status}
                                        </button>
                                    </Form>
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
    );
}
