/* eslint-disable max-len */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import bemHelper from '@kammy/bem';

import InjuredIcon from '../icons/warning.svg';
import useLiveScores from '../../hooks/use-live-scores';
import { StatsHeaders, StatsCells } from './components/tableHelpers';
import validateNewPlayers from '../team-warnings/lib/validate-new-player';
import validatePlayer from '../team-warnings/lib/validate-player';
import validateClub from '../team-warnings/lib/validate-club';
import validatePos from '../team-warnings/lib/validate-pos';
import Spacer from '../spacer';
import styles from './styles.module.css';
import ContextualHelp from '../contextual-help';

const bem = bemHelper({ block: 'table' });

const getCircleClass = (player) => {
    switch (player.availStatus) {
        case 'Doubt 75%':
            return 'high';
        case 'Doubt 50%':
            return 'medium';
        case 'Doubt 25%':
            return 'low';
        case 'Suspended':
            return 'low';
        case 'Injured':
            return 'low';
        default:
            return '';
    }
};

const TeamsPage = ({ teams, previousTeams, onShowPositionTimeline, onShowPlayerTimeline, isAdmin }) => {
    const { liveStatsByCode, liveStats } = useLiveScores();
    const newPlayers = validateNewPlayers(teams) || [];
    const duplicatePlayers = validatePlayer(teams) || [];
    const allClubWarnings = validateClub(teams);
    const allPosWarnings = validatePos(teams);

    return (
        <section>
            {liveStats.length > 0 && (
                <Spacer all={{ top: Spacer.spacings.SMALL, bottom: Spacer.spacings.SMALL }}>
                    <span className="table">
                        <span className="cell cell--live">Any stats in orange are live and are not final.</span>
                    </span>
                </Spacer>
            )}
            {Object.keys(teams).map((managerName) => (
                <Fragment key={managerName}>
                    <Spacer all={{ top: Spacer.spacings.LARGE, bottom: Spacer.spacings.SMALL }}>
                        <h2>{managerName}</h2>
                    </Spacer>
                    <table className="table">
                        <thead>
                            <tr className="row row--header">
                                <th className="cell cell--player">Player</th>
                                <StatsHeaders />
                            </tr>
                        </thead>
                        <tbody>
                            {teams[managerName].map(
                                ({ player, playerName, teamPos, pos, seasonToGameWeek, gameWeekStats }, i) => {
                                    if (!player) return null; // allow for week zero
                                    const clubWarnings = allClubWarnings[managerName] || [];
                                    const posWarnings = allPosWarnings[managerName] || [];
                                    const playerLastGW =
                                        previousTeams && previousTeams[managerName]
                                            ? previousTeams[managerName][i]
                                            : {};
                                    const className =
                                        playerLastGW && playerLastGW.playerName !== playerName ? bem('transfer') : '';
                                    const warningClassName =
                                        isAdmin &&
                                        (clubWarnings.indexOf(player.club) > -1 ||
                                            posWarnings.indexOf(player.name) > -1 ||
                                            newPlayers.indexOf(player.name) > -1 ||
                                            duplicatePlayers.indexOf(player.name) > -1)
                                            ? 'row row--warning'
                                            : 'row';
                                    const img = `https://fantasyfootball.skysports.com/assets/img/players/${player.code}.png`;
                                    const livePoints = (liveStatsByCode && liveStatsByCode[player.code]) || {};
                                    const circleClass = getCircleClass(player);
                                    return (
                                        <tr key={playerName} className={`${className} ${warningClassName}`}>
                                            <td className="cell cell--player">
                                                <div className={styles.player}>
                                                    <a
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            onShowPositionTimeline({
                                                                position: pos,
                                                                gameWeeks: player.gameWeeks,
                                                                season: player.seasonStats,
                                                            });
                                                        }}
                                                        title={`Show ${player.teamPos} timeline`}
                                                        className={styles.playerPosition}
                                                    >
                                                        {pos === teamPos ? (
                                                            <div>{pos}</div>
                                                        ) : (
                                                            <div>
                                                                {teamPos}
                                                                <div>
                                                                    <small> ({pos.toLowerCase()})</small>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </a>
                                                    <div className={styles.playerImage}>
                                                        {!player.isAvailable ? (
                                                            <ContextualHelp
                                                                body={
                                                                    <div>
                                                                        <strong>{player.availStatus}</strong>
                                                                        {player.availReason && (
                                                                            <p>{player.availReason}</p>
                                                                        )}
                                                                        {player.availNews && <p>{player.availNews}</p>}
                                                                        {player.returnDate && (
                                                                            <p>
                                                                                <strong>Return Date: </strong>{' '}
                                                                                {player.returnDate}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                }
                                                                Trigger={
                                                                    <div className={styles.imageContainer}>
                                                                        <div
                                                                            className={cx(
                                                                                styles.circle,
                                                                                styles[circleClass],
                                                                            )}
                                                                        >
                                                                            <img src={img} loading="lazy" alt="" />
                                                                        </div>
                                                                        <span
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: '-4px',
                                                                                right: '-4px',
                                                                            }}
                                                                            className={styles[circleClass]}
                                                                        >
                                                                            <InjuredIcon
                                                                                height={16}
                                                                                width={16}
                                                                                stroke="currentColor"
                                                                                fill="white"
                                                                            />
                                                                        </span>
                                                                    </div>
                                                                }
                                                            />
                                                        ) : (
                                                            <div className={cx(styles.circle)}>
                                                                <img src={img} loading="lazy" alt="" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={styles.playerName}>
                                                        <a
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                onShowPlayerTimeline({ player });
                                                            }}
                                                            title={`Show ${teamPos} timeline`}
                                                        >
                                                            <p>
                                                                <span className="show-625">{playerName}</span>
                                                                <span className="hide-625">
                                                                    {playerName.split(',')[0]}
                                                                </span>
                                                            </p>
                                                        </a>
                                                        <div className={styles.playerClub}>
                                                            <span className="show-550">{player.club}</span>
                                                            <span className="hide-550">
                                                                {player.club.split(' ')[0]}{' '}
                                                                {(player.club.split(' ')[1] || '').charAt(0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <StatsCells
                                                seasonToGameWeek={seasonToGameWeek}
                                                gameWeekStats={gameWeekStats}
                                                livePoints={livePoints}
                                            />
                                        </tr>
                                    );
                                },
                            )}
                        </tbody>
                    </table>
                </Fragment>
            ))}
        </section>
    );
};

TeamsPage.propTypes = {
    teams: PropTypes.object,
    previousTeams: PropTypes.object,
    onShowPositionTimeline: PropTypes.func,
    onShowPlayerTimeline: PropTypes.func,
    isAdmin: PropTypes.bool,
};

TeamsPage.defaultProps = {
    isAdmin: false,
    teams: {},
    previousTeams: {},
    onShowPositionTimeline: () => {},
    onShowPlayerTimeline: () => {},
};

export default TeamsPage;
