// app/routes/api.gw-points.ts
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requestFormData } from '../../_shared/lib/form-data';

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get("action");

        switch (action) {
            case "summary":
                const { getGameweekPointsSummary } = await import("../../_shared/lib/sheets/player-gw-points");
                const summary = await getGameweekPointsSummary();
                return data({
                    success: true,
                    data: summary
                });

            case "read":
                const { readPlayerGameweekPointsFromSheet } = await import("../../_shared/lib/sheets/player-gw-points");
                const gameweekPoints = await readPlayerGameweekPointsFromSheet();
                return data({
                    success: true,
                    data: gameweekPoints
                });

            default:
                return data({
                    success: false,
                    error: "Invalid action. Use 'summary' or 'read'"
                }, { status: 400 });
        }

    } catch (error) {
        console.error("Round points loader error:", error);
        return data({
            success: false,
            error: error instanceof Error ? error.message : "Failed to process round points request"
        }, { status: 500 });
    }
}

export async function action({ request, context }: ActionFunctionArgs): Promise<Response> {
    try {
        const formData = await requestFormData({ request, context });
        const actionType = formData.get("actionType") as string | null;

        if (!actionType) {
            return data({
                success: false,
                error: "Action type is required"
            }, { status: 400 });
        }

        switch (actionType) {
            case "generateGameweekPoints":
                console.log('🔄 API: Generating gw points...');

                const { writePlayerGameweekPointsToSheet } = await import("../../_shared/lib/sheets/player-gw-points");
                await writePlayerGameweekPointsToSheet();

                return data({
                    success: true,
                    message: "Gameweek points generated successfully and written to sheet"
                });

            case "getGameweekPointsStatus":
                const { getGameweekPointsSummary } = await import("../../_shared/lib/sheets/player-gw-points");
                const statusSummary = await getGameweekPointsSummary();

                return data({
                    success: true,
                    message: "Gameweek points status retrieved",
                    data: statusSummary
                });

            default:
                return data({
                    success: false,
                    error: "Invalid action type"
                }, { status: 400 });
        }

    } catch (error) {
        console.error("Round points action error:", error);
        return data({
            success: false,
            error: error instanceof Error ? error.message : "Failed to perform round points action"
        }, { status: 500 });
    }
}
