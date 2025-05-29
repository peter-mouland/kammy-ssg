import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useActionData } from "react-router";
import { getDraftAdminData, handleDraftAction } from "../server/draft-admin.server";
import type { DraftAdminData } from "../server/draft-admin.server";
import { DivisionCard } from "../components/division-card";
import { ActionMessage } from "../components/action-message";
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
        const draftAdminData = await getDraftAdminData();
        return data<DraftAdminData>(draftAdminData);
    } catch (error) {
        console.error("Draft admin loader error:", error);
        throw new Response("Failed to load draft setup data", { status: 500 });
    }
}

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await request.formData();
        const actionType = formData.get("actionType")?.toString() || "";
        const divisionId = formData.get("divisionId")?.toString();

        const result = await handleDraftAction({ actionType, divisionId });
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
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>
                    Draft Setup
                </h1>
                <p className={styles.pageSubtitle}>
                    Generate draft orders and manage the draft process
                </p>
            </div>

            {/* Action Messages */}
            <ActionMessage
                success={actionData?.success}
                error={actionData?.error}
                message={actionData?.message}
            />

            {/* Division Management */}
            <div className={styles.divisionGrid}>
                {divisions.map((division) => (
                    <DivisionCard
                        key={division.id}
                        division={division}
                        teams={userTeamsByDivision[division.id] || []}
                        orders={draftOrders[division.id] || []}
                        draftState={draftState}
                    />
                ))}
            </div>
        </div>
    );
}
