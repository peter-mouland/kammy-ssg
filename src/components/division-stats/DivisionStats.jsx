import React from 'react';
import PropTypes from 'prop-types';
import { Cookies } from 'react-cookie';
import bemHelper from '@kammy/bem';

import GameWeekSwitcher from '../gameweek-switcher';
import Table from './DivisionStats.table';

const bem = bemHelper({ block: 'division-stats' });

class DivisionStats extends React.Component {
  state = { }

  componentDidMount() {
    const {
      divisionId, gameWeeksLoaded, fetchGameWeeks,
      fetchAllPlayerData, fetchDivision,
      playersLoaded, divisionLoaded,
      fetchLiveScores, liveScoresLoaded,
    } = this.props;

    if (!liveScoresLoaded) fetchLiveScores();
    if (!playersLoaded) fetchAllPlayerData();
    if (!divisionLoaded) fetchDivision(divisionId);
    if (!gameWeeksLoaded) fetchGameWeeks();
  }

  render() {
    const {
      loaded, label, managersSeason, selectedGameWeek, cookies, managers, liveScores, playersByCode,
    } = this.props;
    return (
      <section id="teams-page" className={bem()} data-b-layout="container">
        <h1>{label}</h1>
        <div data-b-layout="vpad">
          {loaded && <GameWeekSwitcher />}
        </div>
        <div data-b-layout="vpad">
          <Table
            playersByCode={playersByCode}
            liveScores={liveScores}
            managers={managers}
            selectedGameWeek={selectedGameWeek}
            managersSeason={managersSeason}
            isAdmin={cookies.get('is-admin') === 'true' || false}
          />
        </div>
      </section>
    );
  }
}

DivisionStats.propTypes = {
  selectedGameWeek: PropTypes.number,
  loaded: PropTypes.bool,
  gameWeeksLoaded: PropTypes.bool,
  players: PropTypes.object,
  division: PropTypes.object,
  playersByCode: PropTypes.object,
  liveScores: PropTypes.object,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  divisionId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  managersSeason: PropTypes.object,

  fetchGameWeeks: PropTypes.func.isRequired,
  fetchAllPlayerData: PropTypes.func.isRequired,
  fetchDivision: PropTypes.func.isRequired,

  fetchLiveScores: PropTypes.func.isRequired,
  liveScoresLoaded: PropTypes.bool,

  playersLoading: PropTypes.bool,
  playersLoaded: PropTypes.bool,
  divisionLoaded: PropTypes.bool,
  managers: PropTypes.array,
};

DivisionStats.defaultProps = {
  selectedGameWeek: 1,
  loaded: false,
  gameWeeksLoaded: false,
  playersLoading: false,
  transfersLoading: false,
  playersLoaded: false,
  liveScoresLoaded: false,
  transfersLoaded: false,
  divisionLoaded: false,
  transfers: {},
  Players: {},
  PlayersCount: null,
  gameWeeksCount: null,
  managersSeason: null,
  transfersCount: null,
  managers: [],
};

DivisionStats.contextTypes = {
  appConfig: PropTypes.object,
};

export default DivisionStats;
