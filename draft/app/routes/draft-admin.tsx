// app/routes/draft-admin.tsx - Enhanced with clear data functionality
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useActionData } from "react-router";
import { requestFormData } from '../lib/form-data';
import { DivisionCard } from "../components/division-card";
import { ActionMessage } from "../components/action-message";
import { PageHeader } from "../components/page-header";
import { LayoutGrid } from '../components/layout-grid';
import { ClearDataButton } from '../components/clear-data-button';
import styles from './draft-admin.module.css';

export const meta: MetaFunction = () => {
    return [
        { title: "Draft Setup - Fantasy Football Draft" },
        { name: "description", content: "Generate and manage draft orders for fantasy football league" },
    ];
};

interface ActionData {
    success?: boolean;
    error?: string;
    message?: string;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const { getDraftAdminData } = await import("./server/draft-admin.server");
        const draftAdminData = await getDraftAdminData();
        return data(draftAdminData);
    } catch (error) {
        console.error("Draft admin loader error:", error);
        throw new Response("Failed to load draft setup data", { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get("actionType") as string | null;
        const divisionId = formData.get("divisionId") as string | null;

        if (!actionType) {
            return data<ActionData>({ error: "Action type is required" });
        }

        const { handleDraftAction } = await import("./server/draft-admin.server");

        const result = await handleDraftAction({
            actionType: actionType.trim(),
            divisionId: divisionId?.trim() || undefined
        });

        return data<ActionData>(result);

    } catch (error) {
        console.error("Draft admin action error:", error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : "Failed to perform draft action"
        });
    }
}

export default function DraftAdmin() {
    const { divisions, draftOrders, userTeamsByDivision, draftState } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();

    return (
        <div className={styles.draftAdminContainer}>
            <PageHeader
                title="Draft Setup"
                subTitle="Generate draft orders and manage the draft process"
            />

            <AdminPanel
                draftOrders={draftOrders}
                draftState={draftState}
                userTeamsByDivision={userTeamsByDivision}
                divisions={divisions}
            />

            {/* Action Messages */}
            <ActionMessage
                success={actionData?.success}
                error={actionData?.error}
                message={actionData?.message}
            />

            {/* Division Management */}
            <LayoutGrid>
                {divisions.map((division) => (
                    <DivisionCard
                        key={division.id}
                        division={division}
                        teams={userTeamsByDivision[division.id] || []}
                        orders={draftOrders[division.id] || []}
                        draftState={draftState}
                    />
                ))}
            </LayoutGrid>
        </div>
    );
}

// Admin Panel Component
function AdminPanel({ divisions, userTeamsByDivision, draftOrders, draftState }) {
    return (
        <div className={styles.adminPanel}>
            <h3 className={styles.adminTitle}>🔧 Admin Tools</h3>

            {/* Cache Management Section */}
            <div className={styles.adminSection}>
                <h4 className={styles.sectionTitle}>Cache Management</h4>
                <div className={styles.adminDescription}>
                    Clear cached data to force fresh fetches from FPL API.
                    Use when data seems stale or after API changes.
                </div>

                <div className={styles.clearButtonsGrid}>
                    <div className={styles.clearButtonItem}>
                        <ClearDataButton variant="elements-only" />
                        <div className={styles.buttonDescription}>
                            Clear player summaries only (fastest)
                        </div>
                    </div>

                    <div className={styles.clearButtonItem}>
                        <ClearDataButton variant="fpl-only" />
                        <div className={styles.buttonDescription}>
                            Clear FPL bootstrap + elements
                        </div>
                    </div>

                    <div className={styles.clearButtonItem}>
                        <ClearDataButton variant="all" />
                        <div className={styles.buttonDescription}>
                            Clear everything (nuclear option)
                        </div>
                    </div>
                </div>
            </div>

            {/* Draft Status Section */}
            <div className={styles.adminSection}>
                <h4 className={styles.sectionTitle}>Draft Status</h4>
                <div className={styles.statusGrid}>
                    <StatusCard
                        title="Active Drafts"
                        value={divisions.filter(d =>
                            draftOrders[d.id]?.length > 0
                        ).length}
                        description="Divisions with draft orders"
                    />
                    <StatusCard
                        title="Total Teams"
                        value={Object.values(userTeamsByDivision).flat().length}
                        description="Across all divisions"
                    />
                    <StatusCard
                        title="Draft State"
                        value={draftState?.isActive ? "Active" : "Inactive"}
                        description={draftState?.currentDivisionId || "No active division"}
                        isActive={draftState?.isActive}
                    />
                </div>
            </div>

            {/* Quick Actions Section */}
            <div className={styles.adminSection}>
                <h4 className={styles.sectionTitle}>Quick Actions</h4>
                <div className={styles.quickActions}>
                    <button className={styles.quickActionButton}>
                        📊 Export Draft Data
                    </button>
                    <button className={styles.quickActionButton}>
                        📧 Send Draft Reminders
                    </button>
                    <button className={styles.quickActionButton}>
                        🔄 Sync FPL Data
                    </button>
                </div>
            </div>
        </div>
    );
}

// Status Card Component
interface StatusCardProps {
    title: string;
    value: string | number;
    description: string;
    isActive?: boolean;
}

function StatusCard({ title, value, description, isActive }: StatusCardProps) {
    return (
        <div className={`${styles.statusCard} ${isActive ? styles.active : ''}`}>
            <div className={styles.statusValue}>
                {isActive && <div className={styles.activeIndicator} />}
                {value}
            </div>
            <div className={styles.statusTitle}>{title}</div>
            <div className={styles.statusDescription}>{description}</div>
        </div>
    );
}
