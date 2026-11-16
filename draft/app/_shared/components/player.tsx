import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { FplTeam } from '../lib/fpl/fpl-types';
import type { CustomPosition } from '../types/league-types';
import type { EnhancedPlayerData } from '../types/player-types';
import type { RosterPlayer } from '../types/squad-types';
import styles from './player.module.css';

/**
 * A player as the shared player components render it.
 *
 * The same components display players from both sides of the app: an FPL player
 * (EnhancedPlayerData, from the player list, transfers and the wishlist) and a drafted
 * squad member (RosterPlayer, from a team sheet). They read every field with a fallback
 * -- `playerCode || code`, `playerName || web_name`, `playerPosition || draft.position`
 * -- so one of the two shapes is required and the other's fields are optional.
 *
 * This was previously typed as `EnhancedPlayerData & RosterPlayer`, requiring BOTH,
 * which no caller could ever satisfy -- hence the casts and the errors at every use.
 */
export type DisplayablePlayer =
    | (EnhancedPlayerData & Partial<RosterPlayer>)
    | (RosterPlayer & Partial<EnhancedPlayerData>);

/**
 * A player's photo from the Premier League, by FPL player code.
 *
 * The older `premierleague/photos/.../p{code}.png` address stopped being updated in
 * August 2024: players appeared in old kits and anyone signed since had no photo at all.
 * `premierleague25` is the current one -- same 110x140 size, and no `p` before the code.
 */
export const playerPhotoUrl = (code: number | undefined) =>
    `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`;

/**
 * The same silhouette the transfer status column uses for an owned player, shown when the
 * Premier League has no photo for a player rather than leaving a blank.
 */
const PHOTO_FALLBACK = '👤';

/**
 * The cell's photo, falling back to a silhouette when it fails to load. A photo that fails
 * before hydration has already fired its error event, so it is also checked on mount.
 * Keyed by src at the call site, so a reused row never keeps another player's failure.
 */
const PlayerPhoto = ({ src }: { src: string }) => {
    const [failed, setFailed] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    useEffect(() => {
        const img = imgRef.current;
        if (img?.complete && img.naturalWidth === 0) setFailed(true);
    }, []);

    if (failed) {
        return (
            <span className={`${styles.photoImg} ${styles.photoFallback}`} aria-hidden="true">
                {PHOTO_FALLBACK}
            </span>
        );
    }
    return (
        <img
            ref={imgRef}
            className={styles.photoImg}
            src={src}
            loading="lazy"
            alt=""
            width={35}
            onError={() => setFailed(true)}
        />
    );
};

/**
 * Resolve a player's club.
 *
 * A roster player carries only the FPL player code, so its club has to be looked up
 * through the FPL player list; an FPL player carries team_code directly. Either lookup
 * can miss, so this returns undefined rather than indexing into teamsByCode blindly.
 */
const resolveTeam = (
    player: DisplayablePlayer,
    teamsByCode: Record<number, FplTeam>,
    fplPlayersByCode?: Record<number, EnhancedPlayerData>,
): FplTeam | undefined => {
    const playerCode = player.playerCode ?? player.code;
    const teamCode =
        fplPlayersByCode && playerCode !== undefined ? fplPlayersByCode[playerCode]?.team_code : player.team_code;

    return teamCode === undefined ? undefined : teamsByCode[teamCode];
};

/**
 * The club as a short code (CRY), which is what keeps the table cell narrow. The code is
 * hidden from screen readers and the full name is read instead, so nobody hears "C-R-Y";
 * sighted users get the full name on hover.
 */
const ClubCode = ({ team }: { team?: FplTeam }) => {
    if (!team) return <div className={styles.team} />;
    return (
        <div className={styles.team}>
            <abbr className={styles.clubCode} title={team.name} aria-hidden="true">
                {team.short_name}
            </abbr>
            <span className={styles.visuallyHidden}>{team.name}</span>
        </div>
    );
};

/**
 * The tag after the club code. A loaned player and a new player should never coincide -- a
 * player is only "new" until they join a squad -- but that flag is cleared by hand and can
 * lag, so Loan wins. The loan chip is short; who it is with stays readable on hover and to
 * screen readers.
 */
const StatusTag = ({ isNew, onLoanTo, onLoanFrom }: { isNew?: boolean; onLoanTo?: string; onLoanFrom?: string }) => {
    const loanLabel = [onLoanTo && `On Loan to ${onLoanTo}`, onLoanFrom && `On Loan from ${onLoanFrom}`]
        .filter(Boolean)
        .join(', ');
    if (loanLabel) {
        return (
            <span className={`${styles.statusTag} ${styles.loanChip}`} title={loanLabel}>
                <span aria-hidden="true">Loan</span>
                <span className={styles.visuallyHidden}>{loanLabel}</span>
            </span>
        );
    }
    if (isNew) return <span className={`${styles.statusTag} ${styles.newChip}`}>New</span>;
    return null;
};

/**
 * Exported so anything showing a position uses the same pill -- the colours come from
 * the `--color-position-*` tokens and there should be exactly one place that maps a
 * bucket to them.
 */
export function PositionBadge({ position, isSub = false }: { position: CustomPosition; isSub?: boolean }) {
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
    player: DisplayablePlayer;
    view?: 'row' | 'column';
    onLoanTo?: string;
    onLoanFrom?: string;
    manager?: string;
}) => {
    const img = playerPhotoUrl(player.playerCode || player.code);
    return (
        <div className={`${styles.player_cell} ${view === 'column' ? styles.player_cell_col : ''}`}>
            <div className={styles.photo}>
                <PlayerPhoto key={img} src={img} />
                <span className={styles.photoBadge}>
                    <PositionBadge position={player.playerPosition || player.draft?.position} />
                </span>
            </div>
            <div className={styles.player_cell_details}>
                <div className={`${styles.player_name} ${styles.summaryName}`}>
                    {player.playerName || player.web_name}
                </div>
                <div className={styles.player_details}>
                    <div className={styles.clubLine}>
                        <ClubCode team={resolveTeam(player, teamsByCode, fplPlayersByCode)} />
                        <StatusTag isNew={player.draft?.isNew} onLoanTo={onLoanTo} onLoanFrom={onLoanFrom} />
                    </div>
                    {manager ? (
                        <div className={styles.owner}>
                            <span>{manager}</span>
                        </div>
                    ) : null}
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
    player: DisplayablePlayer;
    onLoanTo?: string;
    onLoanFrom?: string;
    manager?: string;
    points: number;
}) => {
    const img = playerPhotoUrl(player.playerCode || player.code);
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
                <div className={styles.team}>{resolveTeam(player, teamsByCode, fplPlayersByCode)?.name}</div>
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
    const img = playerPhotoUrl(player.code);
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
