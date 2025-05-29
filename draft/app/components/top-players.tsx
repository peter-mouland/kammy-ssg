import { Link } from "react-router";
import { Icon } from "./icon";
import styles from './top-players.module.css';
import type { FplPlayerData } from "../types";

interface TopPlayersProps {
    players: FplPlayerData[];
}

export function TopPlayers({ players }: TopPlayersProps) {
    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">
                    <Icon type="trophy" /> Top FPL Players
                </h2>
                <p className={styles.subtitle}>
                    Best performing players this season
                </p>
            </div>

            <div className={styles.tableContainer}>
                <table className="table">
                    <thead>
                    <tr>
                        <th>Player</th>
                        <th>Team</th>
                        <th>Points</th>
                        <th>Price</th>
                    </tr>
                    </thead>
                    <tbody>
                    {players.slice(0, 10).map((player, index) => (
                        <tr key={player.id}>
                            <td>
                                <div>
                                    <div className={styles.playerName}>
                                        {player.first_name} {player.second_name}
                                    </div>
                                    <div className={styles.playerRank}>
                                        #{index + 1}
                                    </div>
                                </div>
                            </td>
                            <td className={styles.teamName}>
                                Team {player.team}
                            </td>
                            <td className={styles.points}>
                                {player.total_points}
                            </td>
                            <td className={styles.price}>
                                £{(player.now_cost / 10).toFixed(1)}m
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.actionContainer}>
                <Link to="/players" className="btn btn-secondary">
                    View All Players
                </Link>
            </div>
        </div>
    );
}
