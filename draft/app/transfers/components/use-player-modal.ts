/* Location: app/transfers/components/use-player-modal.ts */

import { useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { PLAYER_MODAL_PARAM } from '../lib/player-modal-param';

/**
 * Which player the modal shows, kept in the URL (`?player=<code>`).
 *
 * In the URL so a phone's Back closes the modal rather than leaving the transfers page.
 * Opening pushes a history entry, so closing one we opened steps back over it: otherwise
 * Back after closing would reopen it. A `?player` we didn't open (a reload, a shared link)
 * is removed in place instead.
 */
export function usePlayerModal() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const openedHere = useRef(false);
    const openPlayerCode = Number(searchParams.get(PLAYER_MODAL_PARAM)) || null;

    const open = (playerCode: number) => {
        openedHere.current = true;
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current);
                next.set(PLAYER_MODAL_PARAM, String(playerCode));
                return next;
            },
            { preventScrollReset: true },
        );
    };

    const close = () => {
        if (openedHere.current) {
            openedHere.current = false;
            navigate(-1);
            return;
        }
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current);
                next.delete(PLAYER_MODAL_PARAM);
                return next;
            },
            { replace: true, preventScrollReset: true },
        );
    };

    return { openPlayerCode, open, close };
}
