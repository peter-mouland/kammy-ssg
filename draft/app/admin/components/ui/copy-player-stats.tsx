/* Location: app/admin/components/ui/copy-player-stats.tsx */

import { useState } from 'react';
import type { PlayerStatsData } from '../../../players';
import { buildPlayerStatsTsv } from '../../../players';
import * as Icons from '../icons/admin-icons';
import { AdminSection } from '../layout/admin-section';
import { AdminButton } from './admin-button';
import { AdminMessage } from './admin-message';
import styles from './copy-player-stats.module.css';

const SEASON_VALUE = 'season';

interface CopyPlayerStatsProps {
    currentGameweekId: number;
}

export function CopyPlayerStats({ currentGameweekId }: CopyPlayerStatsProps) {
    const [scope, setScope] = useState<string>(SEASON_VALUE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const availableGameweeks = Array.from({ length: currentGameweekId }, (_, i) => i + 1);

    const handleCopy = async () => {
        setIsLoading(true);
        setMessage(null);

        try {
            const url = scope === SEASON_VALUE ? '/players.json' : `/players.json?gameweek=${scope}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to load player stats (${response.status})`);
            }

            const data = (await response.json()) as PlayerStatsData;
            const tsv = buildPlayerStatsTsv(data);

            await navigator.clipboard.writeText(tsv);

            const scopeLabel = scope === SEASON_VALUE ? 'season to date' : `GW ${scope}`;
            setMessage({
                type: 'success',
                text: `Copied ${data.players.length} players (${scopeLabel}) to clipboard. Paste into Google Sheets.`,
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to copy player stats',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminSection
            title="Copy Player Stats"
            icon={<Icons.FileIcon />}
            description="Copy the full players table as TSV for pasting into Google Sheets"
        >
            <div className={styles.controls}>
                <div className={styles.controlsRow}>
                    <label className={styles.scopeLabel}>
                        <span className={styles.scopeLabelText}>Scope</span>
                        <select
                            className={styles.scopeSelect}
                            value={scope}
                            onChange={(event) => setScope(event.target.value)}
                            disabled={isLoading}
                        >
                            <option value={SEASON_VALUE}>Season to date</option>
                            {availableGameweeks.map((gameweek) => (
                                <option key={gameweek} value={String(gameweek)}>
                                    Gameweek {gameweek}
                                </option>
                            ))}
                        </select>
                    </label>

                    <AdminButton variant="primary" onClick={handleCopy} loading={isLoading} disabled={isLoading}>
                        Copy to clipboard
                    </AdminButton>
                </div>

                {message && <AdminMessage type={message.type}>{message.text}</AdminMessage>}
            </div>
        </AdminSection>
    );
}
