/* eslint-disable max-len */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

// import useLiveScores from '../../hooks/use-live-scores';
import validateNewPlayers from '../team-warnings/lib/validate-new-player';
import validatePlayer from '../team-warnings/lib/validate-player';
import validateClub from '../team-warnings/lib/validate-club';
import validatePos from '../team-warnings/lib/validate-pos';
import Spacer from '../spacer';
import Player from '../player';

const bem = bemHelper({ block: 'table' });

const TeamsPage = ({ selectedGameWeek, teams, previousTeams, isAdmin }) => {
    // const { liveStatsByCode, liveStats } = useLiveScores();
    const newPlayers = validateNewPlayers(teams) || [];
    const duplicatePlayers = validatePlayer(teams) || [];
    const allClubWarnings = validateClub(teams);
    const allPosWarnings = validatePos(teams);

    // {liveStats.length > 0 && (
    //     <Spacer all={{ top: Spacer.spacings.SMALL, bottom: Spacer.spacings.SMALL }}>
    //         <span className="table">
    //             <span className="cell cell--live">Any stats in orange are live and are not final.</span>
    //         </span>
    //     </Spacer>
    // )}
    return (
        <section>
            {Object.keys(teams).map((managerName) => (
                <Fragment key={managerName}>
                    <Spacer all={{ top: Spacer.spacings.LARGE, bottom: Spacer.spacings.SMALL }}>
                        <h2>{managerName}</h2>
                    </Spacer>
                    <table className="table">
                        <thead>
                            <tr className="row row--header">
                                <th className="cell cell--player">Player</th>
                                <th className="cell cell--points">Points</th>
                                <th className="cell cell--apps show-625">Mins</th>
                                <th className="cell cell--gls show-625">Gls</th>
                                <th className="cell cell--asts show-625">Asts</th>
                                <th className="cell cell--cs show-625">Cs</th>
                                <th className="cell cell--con show-625">Con</th>
                                <th className="cell cell--pensv show-625">pensv</th>
                                <th className="cell cell--ycard show-625">Y card</th>
                                <th className="cell cell--rcard show-625">R card</th>
                                <th className="cell cell--sb show-625">Sv</th>
                                <th className="cell cell--bp show-625">bp</th>
                                <th className="cell cell--player" style={{ borderLeft: '1px dashed grey' }}>
                                    Next Gw
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams[managerName]
                                .sort((a, z) => a.posIndex - z.posIndex)
                                .map((teamPlayer, i) => {
                                    if (!teamPlayer.player) return null; // allow for week zero
                                    // console.log(teamPlayer);
                                    const { player, teamPos, gameWeekStats } = teamPlayer;
                                    const clubWarnings = allClubWarnings[managerName] || [];
                                    const posWarnings = allPosWarnings[managerName] || [];
                                    const playerLastGW =
                                        previousTeams && previousTeams[managerName]
                                            ? previousTeams[managerName].sort((a, z) => a.posIndex - z.posIndex)[i]
                                            : {};
                                    const className =
                                        playerLastGW && playerLastGW?.player?.code !== player.code
                                            ? bem('transfer')
                                            : '';
                                    const opoThisGw = player.gameWeeks[selectedGameWeek].fixtures;
                                    const opoNextGw = player.gameWeeks[selectedGameWeek + 1]?.fixtures || [];
                                    const warningClassName =
                                        isAdmin &&
                                        (clubWarnings.indexOf(player.club) > -1 ||
                                            posWarnings.indexOf(player.code) > -1 ||
                                            newPlayers.indexOf(player.code) > -1 ||
                                            duplicatePlayers.indexOf(player.code) > -1)
                                            ? 'row row--warning'
                                            : 'row';
                                    // const livePoints = (liveStatsByCode && liveStatsByCode[player.code]) || {};
                                    // const isLive = livePoints && livePoints.points;
                                    const additional = gameWeekStats; // livePoints && livePoints.points ? livePoints : gameWeekStats;

                                    return (
                                        <tr key={player.code} className={`${className} ${warningClassName}`}>
                                            <td className="cell cell--player">
                                                <Player teamPos={teamPos} player={player} />
                                            </td>
                                            {/* <td className="cell cell--points">{opoThisGw.map((f) => f.aTname)}</td>*/}
                                            <td className="cell cell--points">{additional.points}</td>
                                            <td className="cell cell--apps show-625">{additional.apps}</td>
                                            <td className="cell cell--gls show-625">{additional.gls}</td>
                                            <td className="cell cell--asts show-625">{additional.asts}</td>
                                            <td className="cell cell--cs show-625">{additional.cs}</td>
                                            <td className="cell cell--con show-625">{additional.con}</td>
                                            <td className="cell cell--pensv show-625">{additional.pensv}</td>
                                            <td className="cell cell--ycard show-625">{additional.ycard}</td>
                                            <td className="cell cell--rcard show-625">{additional.rcard}</td>
                                            <td className="cell cell--sb show-625">{additional.sb}</td>
                                            <td className="cell cell--bp show-625">{additional.bp}</td>
                                            <td
                                                className="cell cell--points"
                                                style={{ borderLeft: '1px dashed grey', fontWeight: 'normal' }}
                                            >
                                                <em>
                                                    {opoNextGw.map((f) => (
                                                        <div>
                                                            {f.aTname}{' '}
                                                            <small
                                                                style={{
                                                                    fontSize: '0.8em',
                                                                    color: 'grey',
                                                                }}
                                                            >
                                                                {f.was_home ? '(h)' : '(a)'}
                                                            </small>
                                                        </div>
                                                    ))}
                                                </em>
                                            </td>
                                        </tr>
                                    );
                                })}
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
    isAdmin: PropTypes.bool,
};

TeamsPage.defaultProps = {
    isAdmin: false,
    teams: {},
    previousTeams: {},
};

export default TeamsPage;
