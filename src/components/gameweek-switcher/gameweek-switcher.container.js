import { connect } from 'react-redux';
import { actions as gameWeekActions, selectors as gameWeekSelectors } from '@kammy-ui/redux.game-weeks';

import GameweekSwitcher from './gameweek-switcher';

const { fetchGameWeeks, updateGameWeekIndex } = gameWeekActions;

function mapStateToProps(state) {
  const {
    currentGameWeek, selectedGameWeek, gameWeeks, count: gameWeeksCount,
  } = gameWeekSelectors.getGameWeeks(state);
  const {
    loading: gameWeeksLoading, loaded: gameWeeksLoaded, errors: gameWeeksErrors,
  } = gameWeekSelectors.getStatus(state);
  return {
    currentGameWeek,
    selectedGameWeek,
    gameWeeks,
    gameWeeksCount,
    gameWeeksLoading,
    gameWeeksLoaded,
    gameWeeksErrors,
  };
}

const mapDispatchToProps = (dispatch) => ({
  fetchGameWeeks: () => dispatch(fetchGameWeeks()),
  handleUpdate: (gameWeek) => dispatch(updateGameWeekIndex(gameWeek)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameweekSwitcher);
