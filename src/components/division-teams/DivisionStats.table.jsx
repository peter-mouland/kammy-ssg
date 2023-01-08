/* eslint-disable max-len */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

// import useLiveScores from '../../hooks/use-live-scores';
import { StatsHeaders, StatsCells } from './components/tableHelpers';
import validateNewPlayers from '../team-warnings/lib/validate-new-player';
import validatePlayer from '../team-warnings/lib/validate-player';
import validateClub from '../team-warnings/lib/validate-club';
import validatePos from '../team-warnings/lib/validate-pos';
import Spacer from '../spacer';
import Player from '../player';

const bem = bemHelper({ block: 'table' });

const TeamsPage = ({ teams, previousTeams, isAdmin }) => {
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
                                <StatsHeaders />
                            </tr>
                        </thead>
                        <tbody>
                            {teams[managerName]
                                .sort((a, z) => a.posIndex - z.posIndex)
                                .map((teamPlayer, i) => {
                                    if (!teamPlayer.player) return null; // allow for week zero
                                    const { player, teamPos, seasonToGameWeek, gameWeekStats } = teamPlayer;
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
                                    const warningClassName =
                                        isAdmin &&
                                        (clubWarnings.indexOf(player.club) > -1 ||
                                            posWarnings.indexOf(player.code) > -1 ||
                                            newPlayers.indexOf(player.code) > -1 ||
                                            duplicatePlayers.indexOf(player.code) > -1)
                                            ? 'row row--warning'
                                            : 'row';
                                    // const livePoints = (liveStatsByCode && liveStatsByCode[player.code]) || {};

                                    return (
                                        <tr key={player.code} className={`${className} ${warningClassName}`}>
                                            <td className="cell cell--player">
                                                <Player teamPos={teamPos} player={player} />
                                            </td>
                                            <StatsCells
                                                seasonToGameWeek={seasonToGameWeek}
                                                gameWeekStats={gameWeekStats}
                                                // livePoints={livePoints}
                                            />
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
