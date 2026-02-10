/* Location: app/players/players-json.route.ts */

import type { LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const gameweekParam = url.searchParams.get('gameweek');

        if (gameweekParam) {
            const gameweek = Number.parseInt(gameweekParam, 10);
            if (!Number.isNaN(gameweek) && gameweek > 0) {
                const { getPlayerStatsForGameweek } = await import('./server/players.server');
                const data = await getPlayerStatsForGameweek(gameweek);
                return new Response(JSON.stringify(data), {
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        const { getPlayerStatsData } = await import('./server/players.server');
        const data = await getPlayerStatsData();
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Players JSON loader error:', error);
        throw new Response('Failed to load player statistics', { status: 500 });
    }
}
