/* Location: app/transfers/components/use-player-detail.ts */

import { useQuery } from '@tanstack/react-query';
import { type PlayerDetailData, playerDetailJsonUrl } from '../../players';

/** Says why a player could not be loaded: the status, not FPL's or the server's internals. */
export class PlayerDetailLoadError extends Error {
    constructor(readonly status: number) {
        super(`Could not load this player (${status})`);
    }
}

async function fetchPlayerDetail(playerCode: number): Promise<PlayerDetailData> {
    const response = await fetch(playerDetailJsonUrl(playerCode));
    if (!response.ok) {
        throw new PlayerDetailLoadError(response.status);
    }
    return response.json();
}

/**
 * One player's details for the modal, fetched on the client. Cached per player, so
 * opening the same player again is instant. Retries once before showing the error, so a
 * slow first try doesn't keep the manager waiting through several.
 */
export function usePlayerDetail(playerCode: number) {
    return useQuery({
        queryKey: ['player-detail', playerCode],
        queryFn: () => fetchPlayerDetail(playerCode),
        retry: 1,
        staleTime: 5 * 60 * 1000,
    });
}
