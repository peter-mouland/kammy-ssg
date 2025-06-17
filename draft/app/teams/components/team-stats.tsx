/* Location: app/teams/components/team-stats.tsx */

// /teams/components/team-stats.tsx
import React from 'react';
import type { TeamData } from '../types';
import styles from './team-stats.module.css';

interface TeamStatsProps {
    teamData: TeamData;
    gameweek: number;
    isCurrentGameweek: boolean;
}

export const TeamStats: React.FC<TeamStatsProps> = ({
                                                        teamData,
                                                        gameweek,
                                                        isCurrentGameweek
                                                    }) => {
    const stats = React.useMemo(() => {
        const players = teamData.players;
        const startingXI = players.filter(p => !p.isSub);
        const substitutes = players.filter(p => p.isSub);
        const loanedOut = players.filter(p => p.onLoanTo && p.onLoanTo !== p.userId);
        const loanedIn = players.filter(p => p.onLoanTo === p.userId);

        // Position breakdown
        const positions = {
            gk: players.filter(p => p.playerPosition === 'gk').length,
            centrebacks: players.filter(p => p.playerPosition === 'cb').length,
            fullbacks: players.filter(p => p.playerPosition === 'fb').length,
            midfielders: players.filter(p => p.playerPosition === 'mid').length,
            wideattackers: players.filter(p => p.playerPosition === 'wa').length,
            centralattackers: players.filter(p => p.playerPosition === 'ca').length
        };

        return {
            totalPlayers: players.length,
            startingXI: startingXI.length,
            substitutes: substitutes.length,
            loanedOut: loanedOut.length,
            loanedIn: loanedIn.length,
            positions,
            lastUpdated: teamData.lastUpdated
        };
    }, [teamData]);

    return (
        <div className={styles.teamStats}>
            <h3 className={styles.title}>Team Statistics</h3>

            {/* Main Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.totalPlayers}</div>
                    <div className={styles.statLabel}>Gameweek Points</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.startingXI}</div>
                    <div className={styles.statLabel}>Total Points</div>
                </div>

                {(stats.loanedOut > 0 || stats.loanedIn > 0) && (
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>
                            {stats.loanedOut > 0 && <span className={styles.loanOut}>-{stats.loanedOut}</span>}
                            {stats.loanedIn > 0 && <span className={styles.loanIn}>+{stats.loanedIn}</span>}
                        </div>
                        <div className={styles.statLabel}>Loans</div>
                    </div>
                )}
            </div>

            {/* Position Breakdown */}
            <div className={styles.positionBreakdown}>
                <h4 className={styles.sectionTitle}>Squad Composition</h4>
                <div className={styles.positionStats}>
                    <div className={styles.positionStat}>
                        <div className={styles.positionIcon}>🥅</div>
                        <div className={styles.positionInfo}>
                            <span className={styles.positionName}>Goalkeepers</span>
                            <span className={styles.positionCount}>{stats.positions.gk}</span>
                        </div>
                    </div>

                    <div className={styles.positionStat}>
                        <div className={styles.positionIcon}>🛡️</div>
                        <div className={styles.positionInfo}>
                            <span className={styles.positionName}>Centre Backs</span>
                            <span className={styles.positionCount}>{stats.positions.centrebacks}</span>
                        </div>
                    </div>

                    <div className={styles.positionStat}>
                        <div className={styles.positionIcon}>🏃</div>
                        <div className={styles.positionInfo}>
                            <span className={styles.positionName}>Full Backs</span>
                            <span className={styles.positionCount}>{stats.positions.fullbacks}</span>
                        </div>
                    </div>

                    <div className={styles.positionStat}>
                        <div className={styles.positionIcon}>⚙️</div>
                        <div className={styles.positionInfo}>
                            <span className={styles.positionName}>Midfielders</span>
                            <span className={styles.positionCount}>{stats.positions.midfielders}</span>
                        </div>
                    </div>

                    <div className={styles.positionStat}>
                        <div className={styles.positionIcon}>🏃‍♂️</div>
                        <div className={styles.positionInfo}>
                            <span className={styles.positionName}>Wide Attackers</span>
                            <span className={styles.positionCount}>{stats.positions.wideattackers}</span>
                        </div>
                    </div>

                    <div className={styles.positionStat}>
                        <div className={styles.positionIcon}>⚽</div>
                        <div className={styles.positionInfo}>
                            <span className={styles.positionName}>Central Attackers</span>
                            <span className={styles.positionCount}>{stats.positions.centralattackers}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gameweek Info */}
            <div className={styles.gameweekInfo}>
                <h4 className={styles.sectionTitle}>
                    {gameweek === 0 ? 'Draft Team' : `Gameweek ${gameweek}`}
                    {isCurrentGameweek && <span className={styles.currentBadge}>Current</span>}
                </h4>

                <div className={styles.lastUpdated}>
                    <span className={styles.updateLabel}>Last updated:</span>
                    <span className={styles.updateTime}>
                        {new Date(stats.lastUpdated).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
};
