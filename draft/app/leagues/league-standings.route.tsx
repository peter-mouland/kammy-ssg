// app/routes/league-standings.tsx - Fixed to show separate division standings
import { type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { requestFormData } from '../_shared/lib/form-data';
import type { UserTeamData, DivisionData } from "../_shared/types";
import { LeagueStandings } from './league-standings'

export const meta: MetaFunction = () => {
    return [
        { title: "League Standings - Fantasy Football Draft" },
        { name: "description", content: "View standings for each division in the fantasy football league" },
    ];
};

interface LoaderData {
    userTeamsByDivision: Record<string, UserTeamData[]>;
    divisions: DivisionData[];
    selectedDivision?: string;
}

interface ActionData {
    success?: boolean;
    error?: string;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const url = new URL(request.url);
        const selectedDivision = url.searchParams.get("division");

        // Dynamic import to keep server code on server
        const { getLeagueStandingsData } = await import("../leagues/server/league-standings.server");
        const loaderData = await getLeagueStandingsData(selectedDivision);

        return data<LoaderData>(loaderData);

    } catch (error) {
        console.error("League standings loader error:", error);
        throw new Response("Failed to load standings data", { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await requestFormData({ request, context });

        // Dynamic import to keep server code on server
        const { handleLeagueStandingsAction } = await import("../leagues/server/league-standings.server");
        const result = await handleLeagueStandingsAction(formData);

        return data<ActionData>(result);

    } catch (error) {
        console.error("League standings action error:", error);
        return data<ActionData>({
            error: error instanceof Error ? error.message : "Failed to perform action"
        });
    }
}

export default LeagueStandings
