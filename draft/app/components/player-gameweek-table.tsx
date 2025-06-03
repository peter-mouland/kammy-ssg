// app/components/player-gameweek-table.tsx
import { formatPointsDisplay } from '../lib/points';
import { isStatRelevant } from '../lib/is-stat-relevant';
import styles from './player-gameweek-table.module.css';

interface GameweekStatWithPoints {
    gameweek: number;
    minutes: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    goalsConceded: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    penaltiesSaved: number;
    bonus: number;
    opponent: number;
    wasHome: boolean;
    teamHScore: number;
    teamAScore: number;
    customPoints: {
        appearance: number;
        goals: number;
        assists: number;
        cleanSheets: number;
        goalsConceded: number;
        yellowCards: number;
        redCards: number;
        saves: number;
        penaltiesSaved: number;
        bonus: number;
        total: number;
    } | null;
    fplPoints: number;
    generatedAt: string | null;
}

interface PlayerGameweekTableProps {
    gameweekStats: GameweekStatWithPoints[];
    position: string;
    currentGameweek: number;
}

export function PlayerGameweekTable({
                                        gameweekStats,
                                        position,
                                        currentGameweek
                                    }: PlayerGameweekTableProps) {
    const positionLower = position.toLowerCase();

    return (
        <div className={styles.tableContainer}>
            <table className={styles.gameweekTable}>
                <thead>
                <tr>
                    <th className={styles.gameweekHeader}>GW</th>
                    <th>Min</th>
                    <th>Goals</th>
                    <th>Assists</th>
                    {isStatRelevant('clean_sheets', position) && <th>CS</th>}
                    {isStatRelevant('goals_conceded', position) && <th>GC</th>}
                    {isStatRelevant('saves', position) && <th>Saves</th>}
                    {isStatRelevant('penalties_saved', position) && <th>Pen S</th>}
                    <th>YC</th>
                    <th>RC</th>
                    {isStatRelevant('bonus', position) && <th>Bonus</th>}
                    <th className={styles.pointsHeader}>Custom Pts</th>
                    <th className={styles.pointsHeader}>FPL Pts</th>
                    <th>Opponent</th>
                    <th>Result</th>
                </tr>
                </thead>
                <tbody>
                {gameweekStats.map((gw) => (
                    <GameweekRow
                        key={gw.gameweek}
                        gameweek={gw}
                        position={positionLower}
                        isCurrentGameweek={gw.gameweek === currentGameweek}
                    />
                ))}
                </tbody>
            </table>

            {gameweekStats.length === 0 && (
                <div className={styles.noData}>
                    No gameweek data available for this player.
                </div>
            )}
        </div>
    );
}

interface GameweekRowProps {
    gameweek: GameweekStatWithPoints;
    position: string;
    isCurrentGameweek: boolean;
}

function GameweekRow({ gameweek: gw, position, isCurrentGameweek }: GameweekRowProps) {
    const hasCustomPoints = gw.customPoints !== null;

    return (
        <tr className={`${styles.gameweekRow} ${isCurrentGameweek ? styles.currentGameweek : ''} ${!hasCustomPoints ? styles.noCustomPoints : ''}`}>
            <td className={styles.gameweekCell}>
                <span className={styles.gameweekNumber}>
                    {gw.gameweek}
                    {isCurrentGameweek && <span className={styles.liveBadge}>LIVE</span>}
                </span>
            </td>

            <td className={gw.minutes === 0 ? styles.noPlay : ''}>{gw.minutes}</td>

            <td className={gw.goals > 0 ? styles.positive : ''}>{gw.goals}</td>

            <td className={gw.assists > 0 ? styles.positive : ''}>{gw.assists}</td>

            {isStatRelevant('clean_sheets', position) && (
                <td className={gw.cleanSheets > 0 ? styles.positive : ''}>{gw.cleanSheets}</td>
            )}

            {isStatRelevant('goals_conceded', position) && (
                <td className={gw.goalsConceded > 0 ? styles.negative : ''}>{gw.goalsConceded}</td>
            )}

            {isStatRelevant('saves', position) && (
                <td className={gw.saves > 0 ? styles.positive : ''}>{gw.saves}</td>
            )}

            {isStatRelevant('penalties_saved', position) && (
                <td className={gw.penaltiesSaved > 0 ? styles.positive : ''}>{gw.penaltiesSaved}</td>
            )}

            <td className={gw.yellowCards > 0 ? styles.negative : ''}>{gw.yellowCards}</td>

            <td className={gw.redCards > 0 ? styles.negative : ''}>{gw.redCards}</td>

            {isStatRelevant('bonus', position) && (
                <td className={gw.bonus > 0 ? styles.positive : ''}>{gw.bonus}</td>
            )}

            <td className={`${styles.pointsCell} ${styles.customPoints}`}>
                {hasCustomPoints ? (
                    <span className={gw.customPoints!.total > 0 ? styles.positive : gw.customPoints!.total < 0 ? styles.negative : ''}>
                        {formatPointsDisplay(gw.customPoints!.total)}
                    </span>
                ) : (
                    <span className={styles.noData} title="Custom points not calculated for this gameweek">
                        -
                    </span>
                )}
            </td>

            <td className={`${styles.pointsCell} ${styles.fplPoints}`}>
                <span className={gw.fplPoints > 0 ? styles.positive : gw.fplPoints < 0 ? styles.negative : ''}>
                    {gw.fplPoints}
                </span>
            </td>

            <td className={styles.opponentCell}>
                <span className={styles.opponent}>
                    {gw.wasHome ? '' : '@'}{gw.opponentName}
                </span>
            </td>

            <td className={styles.resultCell}>
                <MatchResult
                    wasHome={gw.wasHome}
                    teamHScore={gw.teamHScore}
                    teamAScore={gw.teamAScore}
                    minutes={gw.minutes}
                />
            </td>
        </tr>
    );
}

interface MatchResultProps {
    wasHome: boolean;
    teamHScore: number;
    teamAScore: number;
    minutes: number;
}

function MatchResult({ wasHome, teamHScore, teamAScore, minutes }: MatchResultProps) {
    if (minutes === 0) {
        return <span className={styles.noPlay}>DNP</span>;
    }

    const playerScore = wasHome ? teamHScore : teamAScore;
    const opponentScore = wasHome ? teamAScore : teamHScore;

    let resultClass = styles.draw;
    if (playerScore > opponentScore) resultClass = styles.win;
    if (playerScore < opponentScore) resultClass = styles.loss;

    return (
        <span className={`${styles.matchResult} ${resultClass}`}>
            {wasHome ? 'H' : 'A'} {playerScore}-{opponentScore}
        </span>
    );
}
