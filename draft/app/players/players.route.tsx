/* Location: app/players/players.route.tsx */

// app/routes/players.tsx
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { PlayersPage } from './players.page';
import type { PlayerStatsData } from './types/player-types';

export const meta: MetaFunction = () => {
    return [
        { title: 'Player Stats - Fantasy Football Draft' },
        { name: 'description', content: 'Comprehensive player statistics with custom scoring system' },
    ];
};

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const gameweekParam = url.searchParams.get('gameweek');

        if (gameweekParam) {
            const gameweek = Number.parseInt(gameweekParam, 10);
            if (!Number.isNaN(gameweek) && gameweek > 0) {
                const { getPlayerStatsForGameweek } = await import('../players/server/players.server');
                const playerStatsData = await getPlayerStatsForGameweek(gameweek);
                return data<PlayerStatsData>(playerStatsData);
            }
        }

        const { getPlayerStatsData } = await import('../players/server/players.server');
        const playerStatsData = await getPlayerStatsData();
        return data<PlayerStatsData>(playerStatsData);
    } catch (error) {
        console.error('Player stats loader error:', error);
        throw new Response('Failed to load player statistics', { status: 500 });
    }
}

export default PlayersPage;
