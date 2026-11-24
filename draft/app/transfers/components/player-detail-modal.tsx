/* Location: app/transfers/components/player-detail-modal.tsx */

import { useEffect, useRef } from 'react';
import { PlayerDetail } from '../../players';
import styles from './player-detail-modal.module.css';
import { usePlayerDetail } from './use-player-detail';

interface PlayerDetailModalProps {
    playerCode: number;
    /** Names the dialog, and the loading and error messages, before the details arrive. */
    playerName: string;
    onClose: () => void;
}

/**
 * The player page, over the transfer flow. It renders inside the form, so the form stays
 * mounted and the manager's selections survive looking at a player.
 *
 * A native `<dialog>` opened with `showModal()`: the browser traps focus inside it and
 * makes the page behind inert. Focus goes back to what opened it on close. Escape and a
 * tap on the backdrop close it as well as the Back control.
 */
export function PlayerDetailModal({ playerCode, playerName, onClose }: PlayerDetailModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const detail = usePlayerDetail(playerCode);

    // The browser hands focus back on close() only while the dialog is still in the page;
    // this one is removed when it closes, so focus goes back to what opened it by hand.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog || dialog.open) return;
        const openedFrom = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
        return () => {
            dialog.close();
            openedFrom?.focus();
        };
    }, []);

    // Escape: let the caller close it, so the URL is updated along with what is on screen.
    const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
        event.preventDefault();
        onClose();
    };

    // A click that lands on the dialog itself, not its content, is a click on the backdrop.
    const handleClick = (event: React.MouseEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled by the dialog's cancel event.
        <dialog
            ref={dialogRef}
            className={styles.dialog}
            // Named for screen readers only: the details already show the name under the photo.
            aria-label={playerName}
            onCancel={handleCancel}
            onClick={handleClick}
        >
            <div className={styles.panel}>
                <div className={styles.header}>
                    <button type="button" className={styles.backButton} onClick={onClose}>
                        ← Back
                    </button>
                </div>

                <div className={styles.body}>
                    {detail.isPending ? (
                        <output className={styles.status}>Loading {playerName}…</output>
                    ) : detail.isError ? (
                        <div className={styles.status} role="alert">
                            <p>Couldn't load {playerName}'s details just now.</p>
                            <button type="button" className={styles.retryButton} onClick={() => detail.refetch()}>
                                Try again
                            </button>
                        </div>
                    ) : (
                        <PlayerDetail data={detail.data} />
                    )}
                </div>
            </div>
        </dialog>
    );
}
