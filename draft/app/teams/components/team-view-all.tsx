// app/teams/components/team-view.tsx
import { AllTeamsTable } from './all-teams-table';
import styles from './team-view.module.css';

export const AllTeamsView = ({ division, teamsByCode, fplPlayersByCode, allTeamsData, viewMode, selectedGameweek }) => {
    return (
        <div className={styles.allTeamsContent}>
            {allTeamsData ? (
                <AllTeamsTable
                    teamsByCode={teamsByCode}
                    fplPlayersByCode={fplPlayersByCode}
                    allTeamsData={allTeamsData}
                    gameweek={selectedGameweek}
                    viewMode={viewMode}
                />
            ) : (
                <div className={styles.loadingAllTeams}>
                    <div className={styles.loadingMessage}>
                        <h3>Loading all teams data...</h3>
                        <p>Please wait while we fetch data for all teams in {division.label}.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
