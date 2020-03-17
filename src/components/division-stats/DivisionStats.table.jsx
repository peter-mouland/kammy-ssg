/* eslint-disable max-len */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import Modal from '../modal';
import PlayerTimeline from './components/PlayerTimeline.table';
import PositionTimeline from './components/PositionTimeline.table';
import { StatsHeaders, StatsCells } from './components/tableHelpers';

const bem = bemHelper({ block: 'table' });

const validatePlayer = (managersSeason, intGameWeek) => {
    const players = Object.keys(managersSeason).reduce((acc, manager) => ([
        ...acc,
        ...managersSeason[manager].map((teamSheetItem) => teamSheetItem.gameWeeks[intGameWeek]),
    ]), []);
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
    return players.reduce((acc, player = {}) => {
        const count = (acc[player.club] || 0) + 1;
        const clubWarnings = count > 2 && acc.clubWarnings.indexOf(player.club) < 0
            ? [...acc.clubWarnings, player.club]
            : acc.clubWarnings;
        return ({
            ...acc,
            [player.club]: count,
            clubWarnings,
        });
    }, { clubWarnings: [] });
};

class TeamsPage extends React.Component {
  state = {
      seasonStats: null,
      gameWeekStats: null,
      showPositionTimeline: false,
      showPlayerTimeline: false,
      positionTimelineProps: {},
      playerTimelineProps: {},
  }

  showPositionTimeline = (e, {
      position, gameWeeks, season, total,
  }) => {
      e.preventDefault();
      this.setState({
          showPositionTimeline: true,
          positionTimelineProps: {
              total,
              gameWeeks,
              season,
              position,
          },
      });
  }

  showPlayerTimeline = (e, { player }) => {
      e.preventDefault();
      this.setState({
          showPlayerTimeline: true,
          playerTimelineProps: { player },
      });
  }

  closeModal = () => {
      this.setState({ showPositionTimeline: false, showPlayerTimeline: false });
  }

  render() {
      const {
          teams, previousTeams, selectedGameWeek, isAdmin,
      } = this.props;
      const {
          showPositionTimeline, positionTimelineProps,
          showPlayerTimeline, playerTimelineProps,
      } = this.state;
      // const duplicatePlayers = validatePlayer(managersSeason, selectedGameWeek) || [];
      // const allClubWarnings = managers.map((manager) => {
      //     const { clubWarnings } = validateClub(managersSeason[manager], selectedGameWeek);
      //     return clubWarnings.length ? { clubWarnings, manager } : undefined;
      // }).filter(Boolean);
      console.log({ teams });
      return (
          <div className={bem(null, null, 'page-content')} data-b-layout="row vpad">
              <div>
                  {showPositionTimeline && (
                      <Modal
                          key={'timeline'}
                          id={'timeline'}
                          wide
                          title={`${positionTimelineProps.position} Timeline`}
                          open={showPositionTimeline}
                          onClose={this.closeModal}
                      >
                          <PositionTimeline { ...positionTimelineProps } />
                      </Modal>
                  )}
                  {showPlayerTimeline && (
                      <Modal
                          key={'player-timeline'}
                          id={'player-timeline'}
                          wide
                          title={`${playerTimelineProps.player.name} Timeline`}
                          open={showPlayerTimeline}
                          onClose={this.closeModal}
                      >
                          <PlayerTimeline { ...playerTimelineProps } />
                      </Modal>
                  )}
                  {/* {isAdmin && duplicatePlayers.length > 0 && ( */}
                  {/*    <div className={'row row--warning'}> */}
                  {/*        This division has the following player(s) in more than 2 teams: {duplicatePlayers.join(', ')} */}
                  {/*    </div> */}
                  {/* )} */}
                  {/* {isAdmin && allClubWarnings.length > 0 && ( */}
                  {/*    <div className={'row row--warning'}> */}
                  {/*        This division has teams with 3+ players from the same club: */}
                  {/*        {allClubWarnings.map(({ manager, clubWarnings }) => `${manager}: ${clubWarnings.join(', ')}`)} */}
                  {/*    </div> */}
                  {/* )} */}
              </div>
              <div data-b-layout="vpad" style={{ margin: '0 auto', width: '100%' }}>
                  <table className={'table'}>
                      {Object.keys(teams).map((managerName) =>
                          // const { clubWarnings } = validateClub(managerName, selectedGameWeek);
                          (
                              <Fragment key={managerName}>
                                  <thead>
                                      <tr>
                                          <th colSpan="4" className={'cell cell--team-manager'}>{managerName}</th>
                                          <th colSpan={24} className={'cell cell--team-season'}>Season</th>
                                      </tr>
                                      <tr className={'row row--header'}>
                                          <th className={'cell cell--team-position'}>Position</th>
                                          <th className={'cell cell--player'}>Player</th>
                                          <th className={'cell cell--club show-850'}>Club</th>
                                          <StatsHeaders />
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {teams[managerName].map(({
                                          playerName, teamPos, pos, seasonToGameWeek, gameWeekStats,
                                      }, i) => {
                                          const playerLastGW = previousTeams[managerName][i];
                                          console.log(managerName, {playerLastGW})
                                          const className = playerLastGW.playerName !== playerName ? bem('transfer') : '';
                                          // const warningClassName = isAdmin && (
                                          //     clubWarnings.indexOf(player.club) > -1 || duplicatePlayers.indexOf(player.name) > -1
                                          // ) ? 'row row--warning' : 'row';
                                          const warningClassName = 'row';
                                          return (
                                              <tr
                                                  key={playerName}
                                                  className={`${className} ${warningClassName}`}
                                              >
                                                  <td className={'cell cell--team-position'}>
                                                      <a
                                                          href={'#'}
                                                          // onClick={(e) => this.showPositionTimeline(e, {
                                                          //     position: pos,
                                                          //     gameWeeks: teamSheetItem.gameWeeks,
                                                          //     season: teamSheetItem.seasonStats,
                                                          // })}
                                                          // title={`Show ${teamSheetItem.teamPos} timeline`}
                                                      >
                                                          {pos}
                                                          {pos !== teamPos && (
                                                              <small> ({teamPos.toLowerCase()})</small>
                                                          )}
                                                      </a>
                                                  </td>
                                                  <td className={'cell cell--player'}>
                                                      <a
                                                          href={'#'}
                                                          onClick={(e) => this.showPlayerTimeline(e, { playerName })}
                                                          title={`Show ${teamPos} timeline`}
                                                      >
                                                          <span className='show-625'>{playerName}</span>
                                                          <span className='hide-625'>{playerName.split(',')[0]}</span>
                                                      </a>
                                                      {/* <small className={'hide-850'}> */}
                                                      {/*    <span className='show-550'>{player.club}</span> */}
                                                      {/*    <span className='hide-550'>{player.club.split(' ')[0]} {(player.club.split(' ')[1] || '').charAt(0)}</span> */}
                                                      {/* </small> */}
                                                  </td>
                                                  {/* <td className={'cell cell--club show-850'}>{player.club}</td> */}
                                                  <StatsCells seasonToGameWeek={seasonToGameWeek} gameWeekStats={gameWeekStats} />
                                              </tr>
                                          );
                                      })}
                                  </tbody>
                                  {/* {isAdmin && clubWarnings.length > 0 && ( */}
                                  {/*    <tr className={'row row--warning'}> */}
                                  {/*        <td colSpan={30}> */}
                                  {/*            This team has more than 2 players within the following clubs: {clubWarnings.join(', ')} */}
                                  {/*        </td> */}
                                  {/*    </tr> */}
                                  {/* )} */}
                              </Fragment>
                          ),
                      )}
                  </table>
              </div>
          </div>
      );
  }
}

TeamsPage.propTypes = {
    selectedGameWeek: PropTypes.number,
    teams: PropTypes.object,
    managersSeason: PropTypes.object,
    isAdmin: PropTypes.bool,
    managers: PropTypes.array,
};

TeamsPage.defaultProps = {
    isAdmin: false,
    selectedGameWeek: 1,
    teams: {},
    managersSeason: {},
    managers: [],
};

export default TeamsPage;
