import React from 'react';
import { getPlayerPosition } from '../lib/draft/draft-rules';
import styles from './debug-player-positions.module.css';

interface Player {
    id: string;
    first_name: string;
    second_name: string;
    draft?: {
        position?: string;
    };
    element_type: number;
}

interface DebugPlayerPositionsProps {
    players: Player[];
    title?: string;
}

export function DebugPlayerPositions({
                                         players,
                                         title = "Player Positions Debug"
                                     }: DebugPlayerPositionsProps) {
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    const samplePlayers = players.slice(0, 10);

    return (
        <div className={styles.debugContainer}>
            <h4 className={styles.debugTitle}>{title}</h4>
            <div className={styles.playersGrid}>
                {samplePlayers.map(player => {
                    const position = getPlayerPosition(player);
                    return (
                        <div
                            key={player.id}
                            className={`${styles.playerRow} ${position === 'unknown' ? styles.unknown : ''}`}
                        >
                            <span className={styles.playerName}>
                                {player.first_name} {player.second_name}
                            </span>
                            <span className={styles.playerDetails}>
                                Position: {position} |
                                Draft: {JSON.stringify(player.draft?.position)} |
                                Element Type: {player.element_type}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className={styles.debugFooter}>
                Showing first 10 players. Check console for full data.
            </div>
        </div>
    );
}
