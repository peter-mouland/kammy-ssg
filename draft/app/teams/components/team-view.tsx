/* Location: app/teams/components/team-view.tsx */

// /teams/components/team-view.tsx
import React, { useState, useMemo } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { FootballPitch } from './football-pitch';
import { GameweekSelector } from './gameweek-selector';
import { TeamStats } from './team-stats';
import { PlayerCard } from './player-card';
import { LoanStatus } from './loan-status';
import type { TeamViewData, FirestoreTeamMember } from '../types';
import styles from './team-view.module.css';

export const TeamView = () => {
    const data = useLoaderData<TeamViewData>();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedGameweek = parseInt(searchParams.get('gameweek') || data.currentGameweek.toString());

    // Get team data for selected gameweek
    const teamData = useMemo(() => {
        return data.gameweekHistory.find(gw => gw.gameweek === selectedGameweek) || data.currentTeam;
    }, [data.gameweekHistory, data.currentTeam, selectedGameweek]);

    // Organize players by position for formation
    const formation = useMemo(() => {
        const players = teamData.players.filter(p => !p.isSub);

        return {
            goalkeeper: players.filter(p => p.teamPosition === 'gk'),
            centrebacks: players.filter(p => p.teamPosition === 'cb'),
            fullbacks: players.filter(p => p.teamPosition === 'fb'),
            midfielders: players.filter(p => p.teamPosition === 'mid'),
            wideattackers: players.filter(p => p.teamPosition === 'wa'),
            centralattackers: players.filter(p => p.teamPosition === 'ca')
        };
    }, [teamData.players]);

    const substitutes = useMemo(() => {
        return teamData.players.filter(p => p.isSub);
    }, [teamData.players]);

    const loanedPlayers = useMemo(() => {
        return {
            loanedOut: teamData.players.filter(p => p.onLoanTo),
            loanedIn: teamData.players.filter(p => p.onLoanTo === data.currentUser.id)
        };
    }, [teamData.players, data.currentUser.id]);

    const handleGameweekChange = (gameweek: number) => {
        setSearchParams({ gameweek: gameweek.toString() });
    };

    const isCurrentGameweek = selectedGameweek === data.currentGameweek;

    return (
        <div className={styles.teamViewContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.teamInfo}>
                    <h1 className={styles.teamName}>{data.currentUser.teamName}</h1>
                    <p className={styles.managerName}>Manager: {data.currentUser.userName}</p>
                    <div className={styles.divisionBadge}>
                        {data.division.name}
                    </div>
                </div>

                <GameweekSelector
                    currentGameweek={data.currentGameweek}
                    selectedGameweek={selectedGameweek}
                    availableGameweeks={data.availableGameweeks}
                    onGameweekChange={handleGameweekChange}
                />
            </div>

            {/* Time Travel Indicator */}
            {!isCurrentGameweek && (
                <div className={styles.timeTravelBanner}>
                    <span className={styles.timeTravelIcon}>⏰</span>
                    Viewing team from Gameweek {selectedGameweek}
                    <button
                        onClick={() => handleGameweekChange(data.currentGameweek)}
                        className={styles.backToCurrentButton}
                    >
                        Back to Current
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Left Column: Pitch */}
                <div className={styles.pitchColumn}>
                    <FootballPitch
                        formation={formation}
                        gameweek={selectedGameweek}
                        isHistorical={!isCurrentGameweek}
                    />

                    {/* Substitutes */}
                    <div style={{ display: 'flex', gap: "2rem"}}>
                        <div className={styles.substitutesSection}>
                            <h3 className={styles.sectionTitle}>
                                Substitutes
                                <span className={styles.playerCount}>({substitutes.length})</span>
                            </h3>
                            <div className={styles.substitutesList}>
                                {substitutes.map(player => (
                                    <PlayerCard
                                        key={`${player.playerCode}-${player.gameweek}`}
                                        player={player}
                                        isSubstitute={true}
                                        gameweek={selectedGameweek}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Loan Status */}
                        <LoanStatus
                            loanedOut={loanedPlayers.loanedOut}
                            loanedIn={loanedPlayers.loanedIn}
                            gameweek={selectedGameweek}
                        />
                    </div>


                </div>

                {/* Right Column: Stats & Info */}
                <div className={styles.infoColumn}>
                    <TeamStats
                        teamData={teamData}
                        gameweek={selectedGameweek}
                        isCurrentGameweek={isCurrentGameweek}
                    />

                </div>
            </div>
        </div>
    );
};
