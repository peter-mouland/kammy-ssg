// app/routes/players.tsx
import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import type { PlayerStatsData } from "../_shared/types";
import { PlayersPage } from '../players/players.page'

export const meta: MetaFunction = () => {
    return [
        { title: "Player Stats - Fantasy Football Draft" },
        { name: "description", content: "Comprehensive player statistics with custom scoring system" },
    ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        // Dynamic import to keep server code on server
        const { getPlayerStatsData } = await import("../players/server/players.server");
        const playerStatsData = await getPlayerStatsData();
        return data<PlayerStatsData>(playerStatsData);
    } catch (error) {
        console.error("Player stats loader error:", error);
        throw new Response("Failed to load player statistics", { status: 500 });
    }
}

export default PlayersPage
