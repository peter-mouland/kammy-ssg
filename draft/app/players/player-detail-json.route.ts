/* Location: app/players/player-detail-json.route.ts */

import type { LoaderFunctionArgs } from 'react-router';
import { loaderErrorResponse } from '../_shared/lib/loader-error';
import type { PlayerDetailData } from './types/player-types';

/**
 * Everything the player page shows, as JSON, for the transfer flow's player modal.
 *
 * The same `getPlayerDetailData` as the `/players/:code` page, so nothing is loaded twice
 * in two ways. It exists because the modal cannot load the page route itself: a fetcher's
 * failed load goes to the error boundary of the page that called it, which would replace
 * the whole transfers page and lose the manager's selections. A plain fetch of this lets
 * the modal show its own error and a retry.
 *
 * Separate from `/players/:code.json`, whose slimmer shape is a public API.
 */
export async function loader({ params }: LoaderFunctionArgs) {
    const playerCode = Number(params.playerCode);

    if (!params.playerCode || Number.isNaN(playerCode)) {
        throw new Response('Invalid player Code', { status: 400 });
    }

    try {
        const { getPlayerDetailData } = await import('./server/player.server');
        const playerDetailData = await getPlayerDetailData(playerCode);

        if (!playerDetailData.player) {
            throw new Response('Player not found', { status: 404 });
        }

        return Response.json(playerDetailData satisfies PlayerDetailData);
    } catch (error) {
        if (error instanceof Response) {
            throw error;
        }
        throw loaderErrorResponse('Could not load this player', error);
    }
}
