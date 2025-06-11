import React from 'react';
import { type ActionFunctionArgs, type LoaderFunctionArgs, data, useLoaderData } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import { DraftSection } from './components/sections/draft-section';
import type { AdminDashboardData } from './types';

interface ActionData {
    success?: boolean;
    error?: string;
    message?: string;
    data?: any;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const { getDraftAdminData } = await import("./server/admin-dashboard.server");
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

        if (!actionType) {
            return data<ActionData>({ error: "Action type is required" });
        }

        const { handleDraftActions } = await import("./server/draft-actions.server");

        const result = await handleDraftActions({
            actionType: actionType.trim(),
            divisionId: divisionId?.trim() || undefined
        });

        return data<ActionData>(result);

    } catch (error) {
        console.error("Draft action error:", error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : "Failed to perform draft action"
        });
    }
}

export default function AdminDraftRoute() {
    const {
        divisions,
        draftOrders,
        userTeamsByDivision,
        draftState
    } = useLoaderData() as AdminDashboardData;

    return (
        <DraftSection
            divisions={divisions}
            draftOrders={draftOrders}
            userTeamsByDivision={userTeamsByDivision}
            draftState={draftState}
        />
    );
}
