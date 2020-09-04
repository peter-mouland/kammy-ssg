/* eslint-disable max-len */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import { StatsHeaders, StatsCells } from './components/tableHelpers';
import validatePlayer from './lib/validate-player';
import validateClub from './lib/validate-club';

const bem = bemHelper({ block: 'table' });

const TeamsPage = ({ teams, previousTeams, onShowPositionTimeline, onShowPlayerTimeline, isAdmin }) => {
    const duplicatePlayers = validatePlayer(teams) || [];
    const allClubWarnings = validateClub(teams);
    return (
        <table className="table">
            {Object.keys(teams).map((managerName) => (
                <Fragment key={managerName}>
                    <thead>
                        <tr>
                            <th colSpan="4" className="cell cell--team-manager">
                                {managerName}
                            </th>
                            <th colSpan={24} className="cell cell--team-season">
                                Season
                            </th>
                        </tr>
                        <tr className="row row--header">
                            <th className="cell cell--team-position">Position</th>
                            <th className="cell cell--player">Player</th>
                            <th className="cell cell--club show-850">Club</th>
                            <StatsHeaders />
                        </tr>
                    </thead>
                    <tbody>
                        {teams[managerName].map(
                            ({ player, playerName, teamPos, pos, seasonToGameWeek, gameWeekStats }, i) => {
                                if (!player) return null; // allow for week zero
                                const clubWarnings = allClubWarnings[managerName] || [];
                                const playerLastGW =
                                    previousTeams && previousTeams[managerName] ? previousTeams[managerName][i] : {};
                                const className =
                                    playerLastGW && playerLastGW.playerName !== playerName ? bem('transfer') : '';
                                const warningClassName =
                                    isAdmin &&
                                    (clubWarnings.indexOf(player.club) > -1 ||
                                        duplicatePlayers.indexOf(player.name) > -1)
                                        ? 'row row--warning'
                                        : 'row';
                                return (
                                    <tr key={playerName} className={`${className} ${warningClassName}`}>
                                        <td className="cell cell--team-position">
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
                                            >
                                                {pos}
                                                {pos !== teamPos && <small> ({teamPos.toLowerCase()})</small>}
                                            </a>
                                        </td>
                                        <td className="cell cell--player">
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    onShowPlayerTimeline({ player });
                                                }}
                                                title={`Show ${teamPos} timeline`}
                                            >
                                                <span className="show-625">{playerName}</span>
                                                <span className="hide-625">{playerName.split(',')[0]}</span>
                                            </a>
                                            <small className="hide-850">
                                                <span className="show-550">{player.club}</span>
                                                <span className="hide-550">
                                                    {player.club.split(' ')[0]}{' '}
                                                    {(player.club.split(' ')[1] || '').charAt(0)}
                                                </span>
                                            </small>
                                        </td>
                                        <td className="cell cell--club show-850">{player.club}</td>
                                        <StatsCells seasonToGameWeek={seasonToGameWeek} gameWeekStats={gameWeekStats} />
                                    </tr>
                                );
                            },
                        )}
                    </tbody>
                    {isAdmin && allClubWarnings[managerName] && (
                        <tr className="row row--warning">
                            <td colSpan={30}>
                                This team has more than 2 players within the following clubs:{' '}
                                {allClubWarnings[managerName].join(', ')}
                            </td>
                        </tr>
                    )}
                </Fragment>
            ))}
        </table>
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
