// app/routes/draft-admin.tsx - Enhanced with clear data functionality
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from 'react-router';
import { data, useLoaderData, useActionData } from "react-router";
import * as React from "react";
import { requestFormData } from '../lib/form-data';
import { DivisionCard } from "../components/division-card";
import { ActionMessage } from "../components/action-message";
import { PageHeader } from "../components/page-header";
import { LayoutGrid } from '../components/layout-grid';
import { ClearDataButton } from '../components/clear-data-button';
import styles from './draft-admin.module.css';
import { SyncDraftButton } from '../components/sync-draft-button';
import { CacheStatus } from '../components/cache-status';
import { RoundPointsButton } from '../components/round-points-button';


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
                title="Admin Tools"
                subTitle="Generate draft orders and manage the draft process"
            />

            <CacheStatus autoRefresh={false} />
            <div className={styles.adminSection}>
                <h4 className={styles.sectionTitle}>Round Points Generation</h4>
                <div className={styles.adminDescription}>
                    Generate round-by-round points using your custom scoring system.
                    Each column represents points earned in one specific round.
                </div>

                <RoundPointsButton variant="primary" size="medium" />
            </div>
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

            <br />
            <br />

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

function AdminPanel({ divisions, userTeamsByDivision, draftOrders, draftState }) {
    return (
        <div className={styles.adminPanel}>
            <div className={styles.adminSection}>
                <h4 className={styles.sectionTitle}>Manual Cache Management</h4>
                <div className={styles.adminDescription}>
                    Manual cache clearing options. Use the Cache Status section above for intelligent data population.
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

            {/* Firebase Sync Section */}
            <div className={styles.adminSection}>
                <h4 className={styles.sectionTitle}>Firebase Sync</h4>
                <div className={styles.adminDescription}>
                    Sync draft state from Google Sheets to Firebase Realtime Database.
                    Use this to fix Firebase state if it gets out of sync with your sheets.
                </div>
                <div className={styles.syncNote}>
                    💡 <strong>Tip:</strong> Use this after manually editing picks in sheets or if Firebase shows wrong turn/state.
                </div>

                <br />
                <SyncDraftButton
                    divisionId={draftState?.currentDivisionId}
                    disabled={!draftState?.currentDivisionId || !draftState?.isActive}
                    size="medium"
                    variant="primary"
                />

                {!draftState?.isActive && (
                    <div className={styles.syncWarning}>
                        ⚠️ No active draft to sync. Start a draft first.
                    </div>
                )}
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
