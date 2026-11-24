/* Location: app/transfers/lib/player-modal-param.ts */

/** The search param holding the player whose details are open over the transfer flow. */
export const PLAYER_MODAL_PARAM = 'player';

/**
 * Whether moving between two URLs only opened, closed or switched the player modal.
 * Nothing the transfers loader reads depends on `?player`, so such a move needs no reload.
 */
export function onlyPlayerModalChanged(currentUrl: URL, nextUrl: URL): boolean {
    if (currentUrl.pathname !== nextUrl.pathname) {
        return false;
    }
    const withoutPlayer = (url: URL) => {
        const params = new URLSearchParams(url.search);
        params.delete(PLAYER_MODAL_PARAM);
        params.sort();
        return params.toString();
    };
    return withoutPlayer(currentUrl) === withoutPlayer(nextUrl);
}
