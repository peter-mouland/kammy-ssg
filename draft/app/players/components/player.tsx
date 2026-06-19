
import { Link } from 'react-router';
import type { FplTeam } from '../../_shared/lib/fpl/fpl-types';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { RosterPlayer } from '../../teams/types/team-types';
import type { CustomPosition } from '../types/player-types';
import styles from './player.module.css';

function PositionBadge({ position, isSub = false }: { position: CustomPosition; isSub?: boolean }) {
    return (
        <span className={`${styles.positionBadge} ${styles[position.toLowerCase()]}`}>
            <span>{position}</span>
            {isSub ? <span className={styles.is_sub}>sub</span> : null}
        </span>
    );
}

export const PlayerSummary = ({
    teamsByCode,
    fplPlayersByCode,
    player,
    manager,
    onLoanTo,
    onLoanFrom,
    view = 'row',
}: {
    teamsByCode: Record<number, FplTeam>;
    fplPlayersByCode?: Record<number, EnhancedPlayerData>;
    player: EnhancedPlayerData & RosterPlayer;
    view?: 'row' | 'column';
    onLoanTo?: string;
    onLoanFrom?: string;
    manager?: string;
}) => {
    const img = `${`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.playerCode || player.code}.png`}`;
    return (
        <div className={`${styles.player_cell} ${view === 'column' ? styles.player_cell_col : ''}`}>
            <div style={{ position: 'relative' }}>
                <img src={img} loading="lazy" alt="" width={35} />

                {onLoanTo && <div className={styles.loanIndicator}>On Loan to {onLoanTo}</div>}
                {onLoanFrom && <div className={styles.loanIndicator}>On Loan from {onLoanFrom}</div>}
            </div>
            <div className={styles.player_cell}>
                {player.draft?.isNew ? <div className={styles.newPlayer}>New</div> : null}
                <PositionBadge position={player.playerPosition || player.draft?.position} isSub={player.isSub} />
                <div className={styles.player_cell_details}>
                    <div className={styles.player_name}>{player.playerName || player.web_name}</div>
                    <div className={styles.player_details}>
                        <div className={styles.team}>
                            {fplPlayersByCode
                                ? teamsByCode[fplPlayersByCode[player.playerCode]?.team_code]?.name
                                : teamsByCode[player.team_code].name || teamsByCode[player.team_code]}
                        </div>
                        {manager ? (
                            <div className={styles.owner}>
                                <span>{manager}</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};
export const PlayerSummaryPoints = ({
    teamsByCode,
    fplPlayersByCode,
    player,
    manager,
    onLoanTo,
    onLoanFrom,
    points,
}: {
    teamsByCode: Record<number, FplTeam>;
    fplPlayersByCode?: Record<number, EnhancedPlayerData>;
    player: EnhancedPlayerData & RosterPlayer;
    onLoanTo?: string;
    onLoanFrom?: string;
    manager?: string;
    points: number;
}) => {
    const img = `${`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.playerCode || player.code}.png`}`;
    return (
        <div className={styles.layout}>
            <div className={styles.layoutImg}>
                <img src={img} loading="lazy" alt="" width={35} />
            </div>

            {onLoanTo || onLoanFrom ? (
                <div className={styles.layoutLoan}>
                    <div className={styles.loanIndicator}>Loan</div>
                </div>
            ) : null}

            {player.draft?.isNew ? (
                <div className={styles.layoutNew}>
                    <div className={styles.newPlayer}>New</div>
                </div>
            ) : null}

            <div className={styles.layoutPosition}>
                <PositionBadge position={player.playerPosition || player.draft?.position} isSub={player.isSub} />
            </div>

            <div className={styles.layoutPlayerName}>
                <div className={styles.player_name}>{player.playerName || player.web_name}</div>
            </div>

            <div className={styles.layoutTeam}>
                <div className={styles.team}>
                    {fplPlayersByCode
                        ? teamsByCode[fplPlayersByCode[player.playerCode]?.team_code]?.name
                        : teamsByCode[player.team_code].name || teamsByCode[player.team_code]}
                </div>
            </div>

            <div className={styles.layoutOwner}>
                {manager ? (
                    <div className={styles.owner}>
                        <span>{manager}</span>
                    </div>
                ) : null}
            </div>

            <div className={styles.layoutPoints}>
                <div className={`${styles.points} ${points >= 0 ? styles.positive : styles.negative}`}>
                    {points} pts
                </div>
            </div>

            {/*<div className={styles.layoutFixture}>*/}
            {/*    <div className={styles.fixture}>fixture</div>*/}
            {/*</div>*/}
        </div>
    );
};

export const Player = ({
    team,
    player,
    position,
}: {
    team: FplTeam;
    player: EnhancedPlayerData;
    position: CustomPosition;
}) => {
    const img = `${`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`}`;
    const playerName = `${player.first_name} ${player.second_name}`;
    return (
        <div className={`${styles.player__large} ${styles[position.toLowerCase()]}`}>
            <div className={styles.player_cell}>
                <img src={img} loading="lazy" alt="" width={70} />
                <span className={styles.player_cell_details}>
                    <h1 className={styles.player_name}>
                        <Link
                            target={'_blank'}
                            to={`https://fantasy.premierleague.com/api/element-summary/${player.id}/`}
                        >
                            <div className={styles.player_fullname}>{playerName}</div>
                            {player.web_name}
                        </Link>
                    </h1>

                    <div className={styles.playerMeta}>
                        <PositionBadge position={position} />
                        <span className={styles.team}>{team.name}</span>
                    </div>
                </span>
            </div>
        </div>
    );
};
