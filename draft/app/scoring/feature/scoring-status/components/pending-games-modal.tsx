// Pending Games Modal Component

import { useEffect } from 'react';
import type { PendingGame } from '../types';
import styles from './pending-games-modal.module.css';

interface PendingGamesModalProps {
    games: PendingGame[];
    onClose: () => void;
}

/**
 * Modal to display pending games that haven't started yet
 */
export function PendingGamesModal({ games, onClose }: PendingGamesModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevent body scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const formatKickoffTime = (isoString: string) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-GB', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal} role="dialog" aria-labelledby="pending-games-title">
                <div className={styles.header}>
                    <h2 id="pending-games-title" className={styles.title}>
                        Pending Games
                    </h2>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                {games.length > 0 ? (
                    <ul className={styles.gamesList}>
                        {games.map((game) => (
                            <li key={game.id} className={styles.gameItem}>
                                <div className={styles.teams}>
                                    {game.homeTeam} vs {game.awayTeam}
                                </div>
                                <div className={styles.kickoffTime}>{formatKickoffTime(game.kickoffTime)}</div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className={styles.emptyState}>No pending games in this gameweek</div>
                )}
            </div>
        </div>
    );
}
