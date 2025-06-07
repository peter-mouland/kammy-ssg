import { Link } from "react-router";
import { Icon } from "./icon";
import styles from './division-overview.module.css';
import type { DivisionData, UserTeamData } from "../types";

interface DivisionOverviewProps {
    divisions: DivisionData[];
    leagueStandings: UserTeamData[];
}

export function DivisionOverview({ divisions, leagueStandings }: DivisionOverviewProps) {
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">
                    <Icon type="team" /> Divisions
                </h2>
                <p className={styles.subtitle}>
                    League division breakdown
                </p>
            </div>

            <div className={styles.divisionList}>
                {divisions.map((division) => {
                    const divisionTeams = leagueStandings.filter(team => team.divisionId === division.id);
                    const averagePoints = divisionTeams.length > 0
                        ? Math.round(divisionTeams.reduce((sum, team) => sum + team.totalPoints, 0) / divisionTeams.length)
                        : 0;

                    return (
                        <div key={division.id} className={styles.divisionCard}>
                            <div className={styles.divisionHeader}>
                                <h3 className={styles.divisionName}>
                                    {division.label}
                                </h3>
                                <span className={styles.teamCount}>
                  {divisionTeams.length} teams
                </span>
                            </div>

                            <div className={styles.averagePoints}>
                                Average: {averagePoints.toLocaleString()} points
                            </div>

                            {divisionTeams.length > 0 && (
                                <div className={styles.leader}>
                                    Leader: {divisionTeams[0]?.teamName} ({divisionTeams[0]?.totalPoints?.toLocaleString()} pts)
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
