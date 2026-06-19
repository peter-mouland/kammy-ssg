// app/teams/components/team-view.tsx
import { useMemo } from 'react';
import { extractLoanStatus } from '../../_shared/lib/roster-conversion-utils';
import { FootballPitch } from './football-pitch';
import { LoanStatus } from './loan-status';
import { TeamStats } from './team-stats';
import styles from './team-view.module.css';

export const MyTeamView = ({ data, viewMode }) => {
    const selectedGameweek = data.selectedGameweekData.fplEvent.id;
    const teamData = data.currentTeam;
    const _substitute = teamData.roster.sub_0;

    // Extract loan status
    const loanStatus = useMemo(() => {
        return extractLoanStatus(teamData.roster, data.currentUser.userId);
    }, [teamData.roster, data.currentUser.userId]);

    const isCurrentGameweek = selectedGameweek === data.currentGameweek;

    return (
        <div className={styles.mainContent}>
            {/* Left Column: Pitch */}
            <div className={styles.pitchColumn}>
                <FootballPitch
                    roster={teamData.roster}
                    gameweek={selectedGameweek}
                    isHistorical={!isCurrentGameweek}
                    teamsByCode={data.teamsByCode}
                    fplPlayersByCode={data.fplPlayersByCode}
                    viewMode={viewMode}
                />

                <div style={{ display: 'flex', gap: '2rem' }}>
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
                />
            </div>
        </div>
    );
};
