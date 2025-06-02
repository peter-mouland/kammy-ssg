// app/routes/draft-admin.tsx
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useActionData } from "react-router";
import { requestFormData } from '../lib/form-data';
import { DivisionCard } from "../components/division-card";
import { ActionMessage } from "../components/action-message";
import { PageHeader } from "../components/page-header";
import { LayoutGrid } from '../components/layout-grid';

export const meta: MetaFunction = () => {
    return [
        { title: "Draft Setup - Fantasy Football Draft" },
        { name: "description", content: "Generate and manage draft orders for fantasy football league" },
    ];
};

// Move this to a shared types file if you haven't already
interface ActionData {
    success?: boolean;
    error?: string;
    message?: string;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        // Dynamic import to keep server code on server
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

        // Dynamic import to keep server code on server
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
        <div>
            <PageHeader title={"Draft Setup"} subTitle={"Generate draft orders and manage the draft process"} />

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
