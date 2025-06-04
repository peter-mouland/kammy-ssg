// components/debug-player-positions.tsx
import React from 'react';
import { getPlayerPosition } from '../lib/draft/draft-rules';

interface DebugPlayerPositionsProps {
    players: any[];
    title?: string;
}

export function DebugPlayerPositions({ players, title = "Player Positions Debug" }: DebugPlayerPositionsProps) {
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    const samplePlayers = players.slice(0, 10);

    return (
        <div style={{
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '1rem',
            margin: '1rem 0',
            fontSize: '0.875rem'
        }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>{title}</h4>
            <div style={{ display: 'grid', gap: '0.25rem' }}>
                {samplePlayers.map(player => {
                    const position = getPlayerPosition(player);
                    return (
                        <div key={player.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.25rem',
                            background: position === 'unknown' ? '#fee2e2' : 'white',
                            borderRadius: '4px'
                        }}>
                            <span>{player.first_name} {player.second_name}</span>
                            <span>
                Position: {position} |
                Draft: {JSON.stringify(player.draft?.position)} |
                Element Type: {player.element_type}
              </span>
                        </div>
                    );
                })}
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                Showing first 10 players. Check console for full data.
            </div>
        </div>
    );
}
