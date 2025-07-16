// app/teams/components/team-view.tsx
import { useMemo, useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { TimeTravelBanner } from '../../_shared/components/time-travel-banner';
import { extractLoanStatus } from '../../_shared/lib/roster-conversion-utils';
import type { StatsViewMode, TeamViewData } from '../types/team-types';
import type { TeamViewTab } from '../types/team-view-types';
import { AllTeamsTable } from './all-teams-table';
import { FootballPitch } from './football-pitch';
import { GameweekSelector } from './gameweek-selector';
import { LoanStatus } from './loan-status';
import { PositionSlotCard } from './position-slot-card';
import { TeamStats } from './team-stats';
import styles from './team-view.module.css';
import { TeamViewTabs } from './team-view-tabs';

export const TeamView = () => {
    const data = useLoaderData<TeamViewData>();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedGameweek = data.selectedGameweekData.fplEvent.id;
    const teamData = data.currentTeam;
    const substitute = teamData.roster.sub_0;

    // Get active tab from URL or default to 'my-team'
    const activeTab = (searchParams.get('tab') as TeamViewTab) || 'my-team';

    // Global view mode state - controls both pitch and stats
    const [viewMode, setViewMode] = useState<StatsViewMode>('season');

    // Extract loan status
    const loanStatus = useMemo(() => {
        return extractLoanStatus(teamData.roster, data.currentUser.userId);
    }, [teamData.roster, data.currentUser.userId]);

    const handleTabChange = (tab: TeamViewTab) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', tab);
        setSearchParams(newParams);
    };

    const handleViewModeChange = (newMode: StatsViewMode) => {
        setViewMode(newMode);
    };

    const isCurrentGameweek = selectedGameweek === data.currentGameweek;

    return (
        <div className={styles.teamViewContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.teamInfo}>
                    <h1 className={styles.teamName}>{data.currentUser.teamName}</h1>
                    <p className={styles.managerName}>Manager: {data.currentUser.userName}</p>
                    <div className={styles.divisionBadge}>{data.division.label}</div>
                </div>

                <div className={styles.headerControls}>
                    <GameweekSelector
                        currentGameweekData={data.currentGameweekData}
                        selectedGameweekData={data.selectedGameweekData}
                        availableGameweeks={data.availableGameweeks}
                    />
                </div>
            </div>

            {/* Time Travel Indicator */}
            {!isCurrentGameweek && <TimeTravelBanner currentGameweek={data.currentGameweek} />}

            {/* Tab Navigation */}
            <TeamViewTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                viewMode={viewMode}
                setViewMode={handleViewModeChange}
                playerCount={data.allTeamsData?.totalPlayers}
            />

            {/* Tab Content */}
            {activeTab === 'my-team' ? (
                <div className={styles.mainContent}>
                    {/* Left Column: Pitch */}
                    <div className={styles.pitchColumn}>
                        <FootballPitch
                            roster={teamData.roster}
                            gameweek={selectedGameweek}
                            isHistorical={!isCurrentGameweek}
                            viewMode={viewMode}
                        />

                        {/* Substitutes */}
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div className={styles.substitutesSection}>
                                <h3 className={styles.sectionTitle}>
                                    Substitutes
                                    <span className={styles.playerCount}>(1)</span>
                                </h3>
                                <div className={styles.substitutesList}>
                                    <PositionSlotCard
                                        key={'sub_0'}
                                        slot={'sub_0'}
                                        positionSlot={substitute}
                                        gameweek={selectedGameweek}
                                        isSubstitute={true}
                                        viewMode={viewMode}
                                    />
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
                        <TeamStats
                            teamData={teamData}
                            gameweek={selectedGameweek}
                            isCurrentGameweek={isCurrentGameweek}
                            viewMode={viewMode}
                            onViewModeChange={handleViewModeChange}
                            hideToggle={false}
                        />
                    </div>
                </div>
            ) : (
                /* All Teams Tab */
                <div className={styles.allTeamsContent}>
                    {data.allTeamsData ? (
                        <AllTeamsTable
                            teamsByCode={data.teamsByCode}
                            fplPlayersByCode={data.fplPlayersByCode}
                            allTeamsData={data.allTeamsData}
                            currentUser={data.currentUser}
                            division={data.division}
                            gameweek={selectedGameweek}
                            isCurrentGameweek={isCurrentGameweek}
                            viewMode={viewMode}
                        />
                    ) : (
                        <div className={styles.loadingAllTeams}>
                            <div className={styles.loadingMessage}>
                                <h3>Loading all teams data...</h3>
                                <p>Please wait while we fetch data for all teams in {data.division.label}.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
