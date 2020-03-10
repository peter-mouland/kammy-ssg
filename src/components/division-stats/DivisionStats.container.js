import { connect } from 'react-redux';
import { actions as playerActions, selectors as playerSelectors } from '@kammy-ui/redux.players';
import { actions as gameWeekActions, selectors as gameWeekSelectors } from '@kammy-ui/redux.game-weeks';
import { actions as divisionActions, selectors as divisionSelectors } from '@kammy-ui/redux.division';
import { selectors as draftSetupSelectors } from '@kammy-ui/redux.draft-setup';
import { actions as skySportsActions } from '@kammy-ui/redux-skysports';

import { withCookies } from 'react-cookie';

import DivisionStats from './DivisionStats';

const { fetchDivision } = divisionActions;
const { fetchAllPlayerData } = playerActions;
const { fetchGameWeeks } = gameWeekActions;
const { fetchLiveScores } = skySportsActions;

function mapStateToProps(state, { divisionId }) {
  const { liveScores = {}, liveScoresLoaded } = state.skySports;
  const players = playerSelectors.getAllPlayerData(state);
  const { selectedGameWeek, currentGameWeek } = gameWeekSelectors.getGameWeeks(state);
  const { loaded: gameWeeksLoaded } = gameWeekSelectors.getStatus(state);
  const { loaded: divisionLoaded } = divisionSelectors.getStatus(divisionId)(state);
  const managersSeason = divisionSelectors[divisionId].season(state) || {};
  const { byDivision } = draftSetupSelectors.getDraftSetup(state);

  const props = {
    liveScores: currentGameWeek === selectedGameWeek ? liveScores : {},
    liveScoresLoaded,
    selectedGameWeek,
    gameWeeksLoaded,
    managers: byDivision.managers[divisionId],
    players: players.data,
    playersByCode: players.byCode,
    playersCount: players.count,
    playersLoading: players.loading,
    playersLoaded: players.loaded,
    playersErrors: players.errors,
    divisionId,
  };

  const loaded = (
    players.loaded
    && gameWeeksLoaded
    && divisionLoaded
  );

  return {
    ...props,
    divisionLoaded,
    managersSeason,
    loaded,
  };
}


const mapDispatchToProps = (dispatch) => ({
  fetchGameWeeks: () => dispatch(fetchGameWeeks()),
  fetchAllPlayerData: () => dispatch(fetchAllPlayerData()),
  fetchDivision: (division) => dispatch(fetchDivision(division)),
  fetchLiveScores: () => dispatch(fetchLiveScores()),
});

export default withCookies(connect(mapStateToProps, mapDispatchToProps)(DivisionStats));
