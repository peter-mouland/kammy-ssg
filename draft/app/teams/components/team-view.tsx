// app/teams/components/team-view.tsx
import { useMemo } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { FootballPitch } from './football-pitch';
import { GameweekSelector } from './gameweek-selector';
import { TeamStats } from './team-stats';
import { PositionSlotCard } from './position-slot-card';
import { LoanStatus } from './loan-status';
import type { TeamViewData, TeamGameweekData } from '../types/team-types';
import { extractLoanStatus, getSubstitutePlayers } from '../../_shared/lib/roster-conversion-utils';
import styles from './team-view.module.css';

export const TeamView = () => {
    const data = useLoaderData<TeamViewData>();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedGameweek = Number.parseInt(searchParams.get('gameweek') || data.currentGameweek.toString());
    // console.log({data})
    // Get team data for selected gameweek
    const teamData = useMemo((): TeamGameweekData => {
        const gameweekData = data.gameweekHistory.find((gw) => gw.gameweek === selectedGameweek);
        return gameweekData || data.currentTeam;
    }, [data.gameweekHistory, data.currentTeam, selectedGameweek]);

    // Get substitutes from roster
    const substitutes = useMemo(() => {
        return getSubstitutePlayers(teamData.roster);
    }, [teamData.roster]);

    // Extract loan status
    const loanStatus = useMemo(() => {
        return extractLoanStatus(teamData.roster, data.currentUser.id);
    }, [teamData.roster, data.currentUser.id]);

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
                    <div className={styles.divisionBadge}>{data.division.name}</div>
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
                        roster={teamData.roster}
                        gameweek={selectedGameweek}
                        isHistorical={!isCurrentGameweek}
                    />

                    {/* Substitutes */}
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div className={styles.substitutesSection}>
                            <h3 className={styles.sectionTitle}>
                                Substitutes
                                <span className={styles.playerCount}>({substitutes.length})</span>
                            </h3>
                            <div className={styles.substitutesList}>
                                {substitutes.map((positionSlot, index) => (
                                    <PositionSlotCard
                                        key={`sub_${index}`}
                                        slot={`sub_${index}` as any}
                                        positionSlot={positionSlot}
                                        gameweek={selectedGameweek}
                                        isSubstitute={true}
                                    />
                                ))}
                                {substitutes.length === 0 && <div className={styles.emptyState}>No substitutes</div>}
                            </div>
                        </div>

                        {/* Loan Status */}
                        <LoanStatus
                            loanedOut={loanStatus.loanedOut}
                            loanedIn={loanStatus.loanedIn}
                            gameweek={selectedGameweek}
                        />
                    </div>
                </div>

                {/* Right Column: Stats & Info */}
                <div className={styles.infoColumn}>
                    <TeamStats teamData={teamData} gameweek={selectedGameweek} isCurrentGameweek={isCurrentGameweek} />
                </div>
            </div>
        </div>
    );
};
