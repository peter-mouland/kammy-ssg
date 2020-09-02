/* eslint-disable max-len */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import { StatsHeaders, StatsCells } from './components/tableHelpers';

const bem = bemHelper({ block: 'table' });

const validatePlayer = (managersSeason, intGameWeek) => {
    const players = Object.keys(managersSeason).reduce(
        (acc, manager) => [
            ...acc,
            ...managersSeason[manager].map((teamSheetItem) => teamSheetItem.gameWeeks[intGameWeek]),
        ],
        [],
    );
    const cache = {};
    return players
        .reduce((acc, player = {}) => {
            const dupe = [...acc];
            if (cache[player.name] && !dupe.includes(player.name)) {
                dupe.push(player.name);
            }
            cache[player.name] = true;
            return dupe;
        }, [])
        .filter(Boolean)
        .filter(({ club }) => !!club);
};

const validateClub = (team = [], intGameWeek) => {
    const players = team
        .map((teamSheetItem) => teamSheetItem.gameWeeks[intGameWeek])
        .filter(Boolean)
        .filter(({ club }) => !!club);
    return players.reduce(
        (acc, player = {}) => {
            const count = (acc[player.club] || 0) + 1;
            const clubWarnings =
                count > 2 && acc.clubWarnings.indexOf(player.club) < 0
                    ? [...acc.clubWarnings, player.club]
                    : acc.clubWarnings;
            return {
                ...acc,
                [player.club]: count,
                clubWarnings,
            };
        },
        { clubWarnings: [] },
    );
};

const TeamsPage = ({
    teams,
    previousTeams,
    onShowPositionTimeline,
    onShowPlayerTimeline,
    selectedGameWeek,
    isAdmin,
}) => (
    // const duplicatePlayers = validatePlayer(managersSeason, selectedGameWeek) || [];
    // const allClubWarnings = managers.map((manager) => {
    //     const { clubWarnings } = validateClub(managersSeason[manager], selectedGameWeek);
    //     return clubWarnings.length ? { clubWarnings, manager } : undefined;
    // }).filter(Boolean);
    <table className="table">
        {Object.keys(teams).map((managerName) => (
            // const { clubWarnings } = validateClub(managerName, selectedGameWeek);
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
                            console.log(seasonToGameWeek)
                            const playerLastGW =
                                previousTeams && previousTeams[managerName] ? previousTeams[managerName][i] : {};
                            const className =
                                playerLastGW && playerLastGW.playerName !== playerName ? bem('transfer') : '';
                            // const warningClassName = isAdmin && (
                            //     clubWarnings.indexOf(player.club) > -1 || duplicatePlayers.indexOf(player.name) > -1
                            // ) ? 'row row--warning' : 'row';
                            const warningClassName = 'row';
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
                {/* {isAdmin && clubWarnings.length > 0 && ( */}
                {/*    <tr className={'row row--warning'}> */}
                {/*        <td colSpan={30}> */}
                {/*            This team has more than 2 players within the following clubs: {clubWarnings.join(', ')} */}
                {/*        </td> */}
                {/*    </tr> */}
                {/* )} */}
            </Fragment>
        ))}
    </table>
);

TeamsPage.propTypes = {
    selectedGameWeek: PropTypes.number,
    teams: PropTypes.object,
    previousTeams: PropTypes.object,
    onShowPositionTimeline: PropTypes.func,
    onShowPlayerTimeline: PropTypes.func,
    isAdmin: PropTypes.bool,
};

TeamsPage.defaultProps = {
    isAdmin: false,
    selectedGameWeek: 1,
    teams: {},
};

export default TeamsPage;
