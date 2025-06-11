// app/routes/draft.tsx - Refactored with components and CSS modules
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { requestFormData } from '../_shared/lib/form-data';
import { Draft } from './draft'

export const meta: MetaFunction = () => {
    return [
        { title: "Live Draft - Fantasy Football Draft" },
        { name: "description", content: "Live fantasy football draft interface" },
    ];
};

interface LoaderData {
    draftState: DraftStateData | null;
    draftPicks: DraftPickData[];
    draftOrder: DraftOrderData[];
    availablePlayers: FplPlayerData[];
    currentUser: string;
    isUserTurn: boolean;
    divisions: DivisionData[];
    userTeams: UserTeamData[];
    selectedDivision: string;
    selectedUser: string;
    draftSequence: any[];
    teams: any[]
}

interface ActionData {
    success?: boolean;
    error?: string;
    pick?: DraftPickData;
    action?: string;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const { loadDraftData } = await import('../draft/server/draft.server');
        const url = new URL(request.url);
        const loaderData = await loadDraftData(url);
        return data<LoaderData>(loaderData);
    } catch (error) {
        console.error("Draft loader error:", error);
        throw new Response("Failed to load draft data", { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get("actionType");

        switch (actionType) {
            case "makePick": {
                const { makeDraftPick } = await import('../draft/server/draft.server');
                const result = await makeDraftPick(formData);
                return data<ActionData>(result);
            }
            default:
                return data<ActionData>({ error: "Invalid action type" });
        }
    } catch (error) {
        console.error("Draft action error:", error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : "Failed to perform draft action"
        });
    }
}

export default Draft
