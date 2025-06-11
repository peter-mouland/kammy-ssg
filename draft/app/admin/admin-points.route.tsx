import React from 'react';
import { type ActionFunctionArgs, type LoaderFunctionArgs, data, useLoaderData } from 'react-router';
import { requestFormData } from '../_shared/lib/form-data';
import { PointsScoringSection } from './components/sections/points-scoring-section';

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
        console.error("Points admin loader error:", error);
        throw new Response("Failed to load admin data", { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get("actionType");

        if (!actionType) {
            return data<ActionData>({ error: "Action type is required" });
        }

        const { handlePointsActions } = await import("./server/points-actions.server");

        const result = await handlePointsActions({
            actionType: actionType.trim()
        });

        return data<ActionData>(result);

    } catch (error) {
        console.error("Points action error:", error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : "Failed to perform points action"
        });
    }
}

export default function AdminPointsRoute() {
    return <PointsScoringSection />;
}
