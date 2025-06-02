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

interface ValidationError {
    field: string;
    message: string;
}

interface ActionData {
    success?: boolean;
    error?: string;
    message?: string;
    validationErrors?: ValidationError[];
}

export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get("actionType") as string | null;
        const divisionId = formData.get("divisionId") as string | null;

        // Validation
        const validationErrors: ValidationError[] = [];

        if (!actionType?.trim()) {
            validationErrors.push({
                field: 'actionType',
                message: 'Action type is required'
            });
        }

        if (actionType === 'generateOrder' || actionType === 'startDraft') {
            if (!divisionId?.trim()) {
                validationErrors.push({
                    field: 'divisionId',
                    message: 'Division must be selected for this action'
                });
            }
        }

        if (validationErrors.length > 0) {
            return data<ActionData>({
                error: 'Validation failed',
                validationErrors
            }, { status: 400 });
        }

        // Import and execute server logic
        const { handleDraftAction, getDraftAdminData } = await import("./server/draft-admin.server");

        // Additional server-side validation
        if (actionType === 'startDraft' && divisionId) {
            const adminData = await getDraftAdminData();

            const division = adminData.divisions.find(d => d.id === divisionId);
            if (!division) {
                return data<ActionData>({
                    error: 'Division not found',
                    validationErrors: [{ field: 'divisionId', message: 'Selected division does not exist' }]
                }, { status: 404 });
            }

            const teams = adminData.userTeamsByDivision[divisionId] || [];
            if (teams.length < 2) {
                return data<ActionData>({
                    error: 'Insufficient teams',
                    validationErrors: [{ field: 'divisionId', message: 'At least 2 teams required to start draft' }]
                }, { status: 400 });
            }

            const draftOrder = adminData.draftOrders[divisionId] || [];
            if (draftOrder.length === 0) {
                return data<ActionData>({
                    error: 'No draft order',
                    validationErrors: [{ field: 'divisionId', message: 'Draft order must be generated before starting' }]
                }, { status: 400 });
            }
        }

        const result = await handleDraftAction({
            actionType: actionType.trim(),
            divisionId: divisionId?.trim() || undefined
        });

        return data<ActionData>(result);

    } catch (error) {
        console.error("Draft admin action error:", error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : "Failed to perform draft action"
        }, { status: 500 });
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
