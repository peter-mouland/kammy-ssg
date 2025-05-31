// app/routes/api/players/season-stats.ts

import type { LoaderFunctionArgs } from "react-router";
import { getFastPlayerStatsData } from "../../../server/player-stats.server";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const data = await getFastPlayerStatsData();

        return {
            players: data.players,
            teams: data.teams,
            positions: data.positions,
        };
    } catch (error) {
        console.error('Error in season stats API:', error);
        throw new Response('Internal Server Error', { status: 500 });
    }
}
