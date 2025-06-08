// app/routes/api.round-points.ts
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requestFormData } from '../lib/form-data';

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get("action");

        switch (action) {
            case "summary":
                const { getRoundPointsSummary } = await import("./server/sheets/player-round-points");
                const summary = await getRoundPointsSummary();
                return data({
                    success: true,
                    data: summary
                });

            case "read":
                const { readPlayerRoundPointsFromSheet } = await import("./server/sheets/player-round-points");
                const roundPoints = await readPlayerRoundPointsFromSheet();
                return data({
                    success: true,
                    data: roundPoints
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
            case "generateRoundPoints":
                console.log('🔄 API: Generating round points...');

                const { writePlayerRoundPointsToSheet } = await import("./server/sheets/player-round-points");
                await writePlayerRoundPointsToSheet();

                return data({
                    success: true,
                    message: "Round points generated successfully and written to sheet"
                });

            case "getRoundPointsStatus":
                const { getRoundPointsSummary } = await import("./server/sheets/player-round-points");
                const statusSummary = await getRoundPointsSummary();

                return data({
                    success: true,
                    message: "Round points status retrieved",
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
