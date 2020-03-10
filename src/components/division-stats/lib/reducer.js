import { reducer as skySportsReducer } from '@kammy-ui/redux-skysports';
import { reducer as dbReducer } from '@kammy-ui/redux.players';
import { reducer as gameWeekReducer } from '@kammy-ui/redux.game-weeks';

export default {
  skySports: skySportsReducer,
  players: dbReducer,
  gameWeeks: gameWeekReducer,
};
