import { reducer as skySportsReducer } from '@kammy-ui/redux-skysports';
import { reducer as divisionReducer } from '@kammy-ui/redux.division';
import { reducer as playersReducer } from '@kammy-ui/redux.players';
import { reducer as gameWeeksReducer } from '@kammy-ui/redux.game-weeks';

export default {
  skySports: skySportsReducer,
  division: divisionReducer,
  players: playersReducer,
  gameWeeks: gameWeeksReducer,
};
