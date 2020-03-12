import { connect } from 'react-redux';
// import { selectors as gameWeekSelectors } from '@kammy-ui/redux.game-weeks';
// import { selectors as divisionSelectors } from '@kammy-ui/redux.division';
// import { selectors as draftSetupSelectors } from '@kammy-ui/redux.draft-setup';

import DivisionStats from './division-rankings';

function mapStateToProps(state, { divisionId }) {
  // const managersSeason = divisionSelectors[divisionId].season(state) || {};
  // const { points: managersPoints, lineChart: lineChartData } = divisionSelectors[divisionId].stats(state);
  // const { current: managersRank, change: managersRankChange } = divisionSelectors[divisionId].rank(state);
  // const { selectedGameWeek } = gameWeekSelectors.getGameWeeks(state);
  // const { byDivision } = draftSetupSelectors.getDraftSetup(state);

  // const lineChartUpToCurrent = [...lineChartData].splice(0, selectedGameWeek + 1);
  //
  return {
    // managers: byDivision.managers[divisionId],
    // managersSeason,
    // managersPoints,
    // managersRank,
    // managersRankChange,
    // lineChartData: lineChartUpToCurrent,
  };
}

export default DivisionStats// connect(mapStateToProps)(DivisionStats);
