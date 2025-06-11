import {
    type MetaFunction,
    type LoaderFunctionArgs,
    type ActionFunctionArgs,
    data,
} from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import { AdminDashboard } from './admin-dashboard';
import type { AdminActionType, ClearVariant } from './types';

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
        const { getDraftAdminData } = await import("../admin/server/admin-dashboard.server");
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
        const actionType = formData.get("actionType");
        const divisionId = formData.get("divisionId");
        const variant = formData.get("variant");

        if (!actionType) {
            return data<ActionData>({ error: "Action type is required" });
        }

        const { handleDraftAction } = await import("../admin/server/admin-dashboard.server");

        const result = await handleDraftAction({
            actionType: actionType.trim() as AdminActionType,
            divisionId: divisionId?.trim() || undefined,
            variant: variant?.trim() as ClearVariant || undefined
        });

        return data<ActionData>(result);

    } catch (error) {
        console.error("Draft admin action error:", error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : "Failed to perform draft action"
        });
    }
}

export default AdminDashboard;
