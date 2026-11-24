/* Location: app/players/lib/player-detail-url.ts */

/** Where `PlayerDetailData` for one player can be fetched as JSON. */
export function playerDetailJsonUrl(playerCode: number): string {
    return `/players/${playerCode}/detail.json`;
}
