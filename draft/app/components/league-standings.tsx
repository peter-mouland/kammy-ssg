import { Link } from "react-router";
import { Icon } from "./icon";
import styles from './league-standings.module.css';
import type { UserTeamData } from "../types";

interface LeagueStandingsProps {
    standings: UserTeamData[];
}

export function LeagueStandings({ standings }: LeagueStandingsProps) {
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">
                    <Icon type="chart" /> League Standings
                </h2>
                <p className={styles.subtitle}>
                    Top teams across all divisions
                </p>
            </div>

            <div className={styles.tableContainer}>
                <table className="table">
                    <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Team</th>
                        <th>Manager</th>
                        <th>Points</th>
                    </tr>
                    </thead>
                    <tbody>
                    {standings.map((team) => (
                        <tr key={team.userId}>
                            <td>
                  <span className={`${styles.rankBadge} ${team.leagueRank <= 3 ? styles.topRank : styles.regularRank}`}>
                    {team.leagueRank}
                  </span>
                            </td>
                            <td>
                                <div>
                                    <div className={styles.teamName}>
                                        {team.teamName}
                                    </div>
                                    <div className={styles.division}>
                                        Division {team.divisionId}
                                    </div>
                                </div>
                            </td>
                            <td className={styles.managerName}>
                                {team.userName}
                            </td>
                            <td className={styles.points}>
                                {team.totalPoints?.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.actionContainer}>
                <Link to="/my-team" className="btn btn-secondary">
                    View Full Standings
                </Link>
            </div>
        </div>
    );
}
