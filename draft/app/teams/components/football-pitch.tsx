/* Location: app/teams/components/football-pitch.tsx */

// /teams/components/football-pitch.tsx
import React from 'react';
import { PlayerCard } from './player-card';
import type { FirestoreTeamMember } from '../types';
import styles from './football-pitch.module.css';

interface FormationData {
    goalkeeper: FirestoreTeamMember[];
    centrebacks: FirestoreTeamMember[];
    fullbacks: FirestoreTeamMember[];
    midfielders: FirestoreTeamMember[];
    wideattackers: FirestoreTeamMember[];
    centralattackers: FirestoreTeamMember[];
}

interface FootballPitchProps {
    formation: FormationData;
    gameweek: number;
    isHistorical: boolean;
}

export const FootballPitch: React.FC<FootballPitchProps> = ({
                                                                formation,
                                                                gameweek,
                                                                isHistorical
                                                            }) => {
    return (
        <div className={styles.pitchContainer}>
            <div className={styles.pitch}>
                {/* Pitch markings */}
                <div className={styles.pitchMarkings}>
                    <div className={styles.centerCircle}></div>
                    <div className={styles.centerLine}></div>
                    <div className={styles.penaltyArea + ' ' + styles.topPenaltyArea}></div>
                    <div className={styles.penaltyArea + ' ' + styles.bottomPenaltyArea}></div>
                    <div className={styles.goalArea + ' ' + styles.topGoalArea}></div>
                    <div className={styles.goalArea + ' ' + styles.bottomGoalArea}></div>
                </div>

                {/* Formation Layout */}
                <div className={styles.formationLayout}>
                    {/* Central Attackers (most forward) */}
                    <div className={styles.centralAttackerLine}>
                        {formation.centralattackers.map((player, index) => (
                            <div
                                key={`${player.playerCode}-${gameweek}`}
                                className={`${styles.playerPosition} ${styles.centralAttacker}`}
                                style={{
                                    '--player-index': index,
                                    '--total-players': formation.centralattackers.length
                                } as React.CSSProperties}
                            >
                                <PlayerCard
                                    player={player}
                                    isSubstitute={false}
                                    gameweek={gameweek}
                                    isOnPitch={true}
                                    positionLabel="CA"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Wide Attackers (left and right, slightly behind CA) */}
                    <div className={styles.wideAttackerLine}>
                        {formation.wideattackers.map((player, index) => (
                            <div
                                key={`${player.playerCode}-${gameweek}`}
                                className={`${styles.playerPosition} ${styles.wideAttacker}`}
                                style={{
                                    '--player-index': index,
                                    '--total-players': formation.wideattackers.length
                                } as React.CSSProperties}
                            >
                                <PlayerCard
                                    player={player}
                                    isSubstitute={false}
                                    gameweek={gameweek}
                                    isOnPitch={true}
                                    positionLabel="WA"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Midfielders */}
                    <div className={styles.midfielderLine}>
                        {formation.midfielders.map((player, index) => (
                            <div
                                key={`${player.playerCode}-${gameweek}`}
                                className={`${styles.playerPosition} ${styles.midfielder}`}
                                style={{
                                    '--player-index': index,
                                    '--total-players': formation.midfielders.length
                                } as React.CSSProperties}
                            >
                                <PlayerCard
                                    player={player}
                                    isSubstitute={false}
                                    gameweek={gameweek}
                                    isOnPitch={true}
                                    positionLabel="MID"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Full Backs (left and right, slightly ahead of CB) */}
                    <div className={styles.fullbackLine}>
                        {formation.fullbacks.map((player, index) => (
                            <div
                                key={`${player.playerCode}-${gameweek}`}
                                className={`${styles.playerPosition} ${styles.fullback}`}
                                style={{
                                    '--player-index': index,
                                    '--total-players': formation.fullbacks.length
                                } as React.CSSProperties}
                            >
                                <PlayerCard
                                    player={player}
                                    isSubstitute={false}
                                    gameweek={gameweek}
                                    isOnPitch={true}
                                    positionLabel="FB"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Centre Backs (central, near goal) */}
                    <div className={styles.centrebackLine}>
                        {formation.centrebacks.map((player, index) => (
                            <div
                                key={`${player.playerCode}-${gameweek}`}
                                className={`${styles.playerPosition} ${styles.centreback}`}
                                style={{
                                    '--player-index': index,
                                    '--total-players': formation.centrebacks.length
                                } as React.CSSProperties}
                            >
                                <PlayerCard
                                    player={player}
                                    isSubstitute={false}
                                    gameweek={gameweek}
                                    isOnPitch={true}
                                    positionLabel="CB"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Goalkeeper */}
                    <div className={styles.goalkeeperLine}>
                        {formation.goalkeeper.map((player) => (
                            <div
                                key={`${player.playerCode}-${gameweek}`}
                                className={`${styles.playerPosition} ${styles.goalkeeper}`}
                            >
                                <PlayerCard
                                    player={player}
                                    isSubstitute={false}
                                    gameweek={gameweek}
                                    isOnPitch={true}
                                    positionLabel="GK"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Historical Indicator */}
                {isHistorical && (
                    <div className={styles.historicalOverlay}>
                        <span className={styles.historicalLabel}>Historical View</span>
                    </div>
                )}
            </div>
        </div>
    );
};
