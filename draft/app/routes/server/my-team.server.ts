// app/routes/server/my-team.server.ts
import { readUserTeams, getUserTeamsByDivision } from "./sheets/user-teams";
import { readDivisions } from "./sheets/divisions";
import type { UserTeamData, DivisionData } from "../../types";

export interface MyTeamLoaderData {
    userTeams: UserTeamData[];
    divisions: DivisionData[];
    selectedDivision?: string;
}

export async function getMyTeamData(url: URL): Promise<MyTeamLoaderData> {
    const selectedDivision = url.searchParams.get("division");

    // Fetch data in parallel
    const [userTeams, divisions] = await Promise.all([
        selectedDivision
            ? getUserTeamsByDivision(selectedDivision)
            : readUserTeams(),
        readDivisions()
    ]);

    // Sort teams by league rank
    const sortedTeams = userTeams.sort((a, b) => a.leagueRank - b.leagueRank);

    return {
        userTeams: sortedTeams,
        divisions,
        selectedDivision: selectedDivision || undefined
    };
}

export async function handleMyTeamAction(formData: FormData) {
    const actionType = formData.get("actionType");

    switch (actionType) {
        case "refreshRankings":
            // This would trigger a recalculation of league rankings
            // Implementation would depend on your specific ranking logic
            return { success: true };

        default:
            throw new Error("Invalid action type");
    }
}
