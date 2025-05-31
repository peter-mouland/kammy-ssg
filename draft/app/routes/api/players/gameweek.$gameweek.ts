// app/routes/api/players/gameweek.$gameweek.ts

import type { LoaderFunctionArgs } from "react-router";
import { getGameweekPlayerData, getGameweekPlayerDataRange } from "../../../server/cache/gameweek-storage";

export async function loader({ params, request }: LoaderFunctionArgs) {
    try {
        const gameweek = parseInt(params.gameweek || '1');
        const url = new URL(request.url);
        const playerIdsParam = url.searchParams.get('playerIds');
        const gameweeksParam = url.searchParams.get('gameweeks');

        if (!playerIdsParam) {
            return {
                error: 'playerIds parameter is required',
                gameweek,
                gameweekData: []
            };
        }

        const playerIds = playerIdsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

        if (playerIds.length === 0) {
            return {
                gameweekData: [],
                gameweek,
                playerCount: 0,
                message: 'No valid player IDs provided'
            };
        }

        let gameweekData;

        if (gameweeksParam) {
            // Multiple gameweeks requested
            const gameweeks = gameweeksParam.split(',').map(gw => parseInt(gw)).filter(gw => !isNaN(gw));
            gameweekData = await getGameweekPlayerDataRange(playerIds, gameweeks);
        } else {
            // Single gameweek
            gameweekData = await getGameweekPlayerData(playerIds, gameweek);
        }

        return {
            gameweekData,
            gameweek,
            playerCount: gameweekData.length,
            requestedPlayers: playerIds.length,
            gameweeks: gameweeksParam ? gameweeksParam.split(',').map(Number) : [gameweek]
        };
    } catch (error) {
        console.error('Error in gameweek data API:', error);
        throw new Response('Internal Server Error', { status: 500 });
    }
}
