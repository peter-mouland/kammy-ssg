/* Location: app/scoring/components/game-stats.tsx */

import type { FplPlayerData } from '../../_shared/lib/fpl/fpl-types';
import type { DivisionSheetData, UserTeamsSheetData } from '../../teams/types/team-types';
import styles from './game-stats.module.css';

interface GameStatsProps {
    divisions: DivisionSheetData[];
    leagueStandings: UserTeamsSheetData[];
    topPlayers: FplPlayerData[];
    currentGameweek: number;
}

export function GameStats({ divisions, leagueStandings, topPlayers, currentGameweek }: GameStatsProps) {
    const stats = [
        {
            value: `${leagueStandings.length}+`,
            label: 'Active Teams',
            color: '#3b82f6',
        },
        {
            value: divisions.length.toString(),
            label: 'Divisions',
            color: '#10b981',
        },
        {
            value: currentGameweek.toString(),
            label: 'Current Gameweek',
            color: '#8b5cf6',
        },
        {
            value: `${topPlayers.length}+`,
            label: 'Players Available',
            color: '#f59e0b',
        },
    ];

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">📊 Game Stats</h2>
            </div>

            <div className={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <div key={index} className={styles.statItem}>
                        <div className={styles.statValue} style={{ color: stat.color }}>
                            {stat.value}
                        </div>
                        <div className={styles.statLabel}>{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
