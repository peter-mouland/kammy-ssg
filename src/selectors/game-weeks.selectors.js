import { createSelector } from 'reselect';
import get from '@kammy/helpers.get';
import parse from 'date-fns/parse';

const toDate = (string = '') => (!string) ? string : parse(string);
const inDateRange = ({ start, end }, comparison) => (
  toDate(comparison) < toDate(end) && toDate(comparison) > toDate(start)
);

const selectedGameWeekSelector = (state) => get(state, 'gameWeeks.selectedGameWeek') || 0;
const gameWeeksSelector = (state) => get(state, 'gameWeeks.data.gameWeeks') || [];

export const getGameWeekFromDate = createSelector(
  gameWeeksSelector,
  (gameWeeks) => (date) => {
    const gwIndex = gameWeeks.findIndex(({ start, end }) => inDateRange({ start, end }, date));
    return gwIndex < 0 ? 1 : gwIndex;
  },
);

export const getGameWeeks = createSelector(
  gameWeeksSelector,
  selectedGameWeekSelector,
  (gameWeeks, selectedGameWeek) => {
    const currentGameWeekIndex = gameWeeks.findIndex(({ start, end }) => inDateRange({ start, end }, new Date()));
    const currentGameWeek = currentGameWeekIndex < 0 ? 1 : currentGameWeekIndex;
    const gw = selectedGameWeek || currentGameWeek;
    return {
      gameWeeks,
      selectedGameWeek: gw,
      currentGameWeek,
      prevGameWeekDates: gw > 0 ? gameWeeks[gw - 1] : null,
      currentGameWeekDates: gameWeeks[gw],
      nextGameWeekDates: gameWeeks[gw + 1],
      count: gameWeeks.length,
    };
  },
);

export const dateIsInCurrentGameWeek = createSelector(
  getGameWeeks,
  ({ currentGameWeekDates }) => (comparisonDate) => {
    try {
      return inDateRange(currentGameWeekDates, comparisonDate);
    } catch (e) {
      console.log('ERROR');
      console.log({ currentGameWeekDates, comparisonDate });
      return false;
    }
  },
);

export const dateIsInGameWeekMinusx = createSelector(
  getGameWeeks,
  ({ gameWeeks, currentGameWeek, currentGameWeekDates }) => (comparisonDate, gwAdjust = 0) => {
    try {
      const adjustedGW = currentGameWeek - gwAdjust;
      const dates = adjustedGW < 0
        ? { start: gameWeeks[0].start, end: currentGameWeekDates.end }
        : { start: gameWeeks[adjustedGW].start, end: currentGameWeekDates.end };
      return inDateRange(dates, comparisonDate);
    } catch (e) {
      console.log('ERROR');
      console.log({
        gameWeeks, gwAdjust, currentGameWeekDates, comparisonDate,
      });
      return false;
    }
  },
);
