// app/routes/players.$playerId.tsx
import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import type { PlayerDetailData } from "../_shared/types";
import { PlayerPage } from '../players/player.page'

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    const playerName = data?.player ? `${data.player.first_name} ${data.player.second_name}` : 'Player';
    return [
        { title: `${playerName} - Player Stats - Fantasy Football Draft` },
        { name: "description", content: `Detailed gameweek statistics and performance for ${playerName}` },
    ];
};

export async function loader({ params }: LoaderFunctionArgs): Promise<Response> {
    const playerId = params.playerId;

    if (!playerId || isNaN(Number(playerId))) {
        throw new Response("Invalid player ID", { status: 400 });
    }

    try {
        const { getPlayerDetailData } = await import("../players/server/player.server");
        const playerDetailData = await getPlayerDetailData(Number(playerId));

        if (!playerDetailData.player) {
            throw new Response("Player not found", { status: 404 });
        }

        return data<PlayerDetailData>(playerDetailData);
    } catch (error) {
        console.error("Player detail loader error:", error);
        if (error instanceof Response) {
            throw error;
        }
        throw new Response("Failed to load player data", { status: 500 });
    }
}

export default PlayerPage
