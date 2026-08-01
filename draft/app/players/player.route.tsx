/* Location: app/players/player.route.tsx */

// app/routes/players.$playerId.tsx
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data } from 'react-router';
import { loaderErrorResponse } from '../_shared/lib/loader-error';
import { PlayerPage } from './player.page';
import type { PlayerDetailData } from './types/player-types';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    const playerName = data?.player ? `${data.player.first_name} ${data.player.second_name}` : 'Player';
    return [
        { title: `${playerName} - Player Stats - Fantasy Football Draft` },
        { name: 'description', content: `Detailed gameweek statistics and performance for ${playerName}` },
    ];
};

export async function loader({ params }: LoaderFunctionArgs) {
    const playerCode = params.playerCode;

    if (!playerCode || Number.isNaN(Number(playerCode))) {
        throw new Response('Invalid player Code', { status: 400 });
    }

    try {
        const { getPlayerDetailData } = await import('../players/server/player.server');
        const playerDetailData = await getPlayerDetailData(Number(playerCode));

        if (!playerDetailData.player) {
            throw new Response('Player not found', { status: 404 });
        }

        return data<PlayerDetailData>(playerDetailData);
    } catch (error) {
        if (error instanceof Response) {
            throw error;
        }
        throw loaderErrorResponse('Could not load this player', error);
    }
}

export default PlayerPage;
