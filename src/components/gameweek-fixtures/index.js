import { connect } from 'react-redux';
import { actions } from '@kammy-ui/redux-fixtures';
import { actions as skySportsActions } from '@kammy-ui/redux-skysports';

import GameWeekFixturesTable from './gameweek-fixtures.table';

const { fetchFixtures } = actions;
const { fetchLiveScores } = skySportsActions;

function mapStateToProps(state) {
  const { liveScores = {}, liveScoresLoaded } = state.skySports;
  return {
    liveScores,
    liveScoresLoaded,
    fixtures: state.fixtures.data,
    loading: state.fixtures.loading,
    errors: state.fixtures.errors,
  };
}

export default connect(
  mapStateToProps,
  {
    fetchFixtures,
    fetchLiveScores,
  },
)(GameWeekFixturesTable);
