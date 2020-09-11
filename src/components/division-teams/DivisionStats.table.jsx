/* eslint-disable max-len */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import { StatsHeaders, StatsCells } from './components/tableHelpers';
import validateNewPlayers from './lib/validate-new-player';
import validatePlayer from './lib/validate-player';
import validateClub from './lib/validate-club';
import validatePos from './lib/validate-pos';
import Spacer from '../spacer';
import styles from './styles.module.css';

const bem = bemHelper({ block: 'table' });

const TeamsPage = ({ teams, previousTeams, onShowPositionTimeline, onShowPlayerTimeline, isAdmin }) => {
    const newPlayers = validateNewPlayers(teams) || [];
    const duplicatePlayers = validatePlayer(teams) || [];
    const allClubWarnings = validateClub(teams);
    const allPosWarnings = validatePos(teams);

    return Object.keys(teams).map((managerName) => (
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
                                previousTeams && previousTeams[managerName] ? previousTeams[managerName][i] : {};
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
                                                <img src={img} loading="lazy" alt="" />
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
                                                        <span className="hide-625">{playerName.split(',')[0]}</span>
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
                                    <StatsCells seasonToGameWeek={seasonToGameWeek} gameWeekStats={gameWeekStats} />
                                </tr>
                            );
                        },
                    )}
                </tbody>
            </table>
        </Fragment>
    ));
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
