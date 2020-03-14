/* eslint-env jest */
import calculateRankChange from './calculate-rank-change';

describe('calculateRankChange()', () => {
  it('should return current scores on gameWeek one', () => {
    const gameWeek2 = {
      'GK / SUB': { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      AM: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      CB: { Olly: 0, Nick: 1.5, Pete: 1.5 },
      FB: { Olly: 0.5, Nick: 2, Pete: 0.5 },
      MID: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      STR: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      total: { Olly: 2.5, Nick: 5.5, Pete: 4 },
    };
    const change = calculateRankChange(undefined, gameWeek2);
    expect(change).toEqual({
      'GK / SUB': { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      AM: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      CB: { Olly: 0, Nick: 1.5, Pete: 1.5 },
      FB: { Olly: 0.5, Nick: 2, Pete: 0.5 },
      MID: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      STR: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      total: { Olly: 2.5, Nick: 5.5, Pete: 4 },
    });
  });

  it('should return when gameWeek one ranks match gameWeek twos ranks', () => {
    const gameWeek1 = {
      'GK / SUB': { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      AM: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      CB: { Olly: 0, Nick: 1.5, Pete: 1.5 },
      FB: { Olly: 0.5, Nick: 2, Pete: 0.5 },
      MID: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      STR: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      total: { Olly: 2.5, Nick: 5.5, Pete: 4 },
    };
    const gameWeek2 = {
      'GK / SUB': { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      AM: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      CB: { Olly: 0, Nick: 1.5, Pete: 1.5 },
      FB: { Olly: 0.5, Nick: 2, Pete: 0.5 },
      MID: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      STR: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      total: { Olly: 2.5, Nick: 5.5, Pete: 4 },
    };
    const change = calculateRankChange(gameWeek1, gameWeek2);
    expect(change).toEqual({
      'GK / SUB': { Olly: 0, Nick: 0, Pete: 0 },
      AM: { Olly: 0, Nick: 0, Pete: 0 },
      CB: { Olly: 0, Nick: 0, Pete: 0 },
      FB: { Olly: 0, Nick: 0, Pete: 0 },
      MID: { Olly: 0, Nick: 0, Pete: 0 },
      STR: { Olly: 0, Nick: 0, Pete: 0 },
      total: { Olly: 0, Nick: 0, Pete: 0 },
    });
  });

  it('should return +1 if gameWeek twos rank is 1 higher than gameWeek one', () => {
    const gameWeek1 = {
      'GK / SUB': { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      AM: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      CB: { Olly: 0, Nick: 1.5, Pete: 1.5 },
      FB: { Olly: 0.5, Nick: 2, Pete: 0.5 },
      MID: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      STR: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      total: { Olly: 2.5, Nick: 5.5, Pete: 4 },
    };
    const gameWeek2 = {
      'GK / SUB': { Olly: 1.5, Nick: 1.5, Pete: 1.5 },
      AM: { Olly: 1.5, Nick: 2.5, Pete: 1.5 },
      CB: { Olly: 1, Nick: 2.5, Pete: 2.5 },
      FB: { Olly: 1.5, Nick: 3, Pete: 1.5 },
      MID: { Olly: 1.5, Nick: 1.5, Pete: 1.5 },
      STR: { Olly: 1.5, Nick: 1.5, Pete: 1.5 },
      total: { Olly: 3.5, Nick: 6.5, Pete: 5 },
    };
    const change = calculateRankChange(gameWeek1, gameWeek2);
    expect(change).toEqual({
      'GK / SUB': { Olly: 1, Nick: 1, Pete: 1 },
      AM: { Olly: 1, Nick: 2, Pete: 1 },
      CB: { Olly: 1, Nick: 1, Pete: 1 },
      FB: { Olly: 1, Nick: 1, Pete: 1 },
      MID: { Olly: 1, Nick: 1, Pete: 1 },
      STR: { Olly: 1, Nick: 1, Pete: 1 },
      total: { Olly: 6, Nick: 7, Pete: 6 },
    });
  });

  it('should return -1 if gameWeek twos rank is 1 lower than gameWeek one', () => {
    const gameWeek1 = {
      'GK / SUB': { Olly: 1.5, Nick: 1.5, Pete: 1.5 },
      AM: { Olly: 1.5, Nick: 2.5, Pete: 1.5 },
      CB: { Olly: 1, Nick: 2.5, Pete: 2.5 },
      FB: { Olly: 1.5, Nick: 3, Pete: 1.5 },
      MID: { Olly: 1.5, Nick: 1.5, Pete: 1.5 },
      STR: { Olly: 1.5, Nick: 1.5, Pete: 1.5 },
      total: { Olly: 3.5, Nick: 6.5, Pete: 5 },
    };
    const gameWeek2 = {
      'GK / SUB': { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      AM: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      CB: { Olly: 0, Nick: 1.5, Pete: 1.5 },
      FB: { Olly: 0.5, Nick: 2, Pete: 0.5 },
      MID: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      STR: { Olly: 0.5, Nick: 0.5, Pete: 0.5 },
      total: { Olly: 2.5, Nick: 5.5, Pete: 4 },
    };
    const change = calculateRankChange(gameWeek1, gameWeek2);
    expect(change).toEqual({
      'GK / SUB': { Olly: -1, Nick: -1, Pete: -1 },
      AM: { Olly: -1, Nick: -2, Pete: -1 },
      CB: { Olly: -1, Nick: -1, Pete: -1 },
      FB: { Olly: -1, Nick: -1, Pete: -1 },
      MID: { Olly: -1, Nick: -1, Pete: -1 },
      STR: { Olly: -1, Nick: -1, Pete: -1 },
      total: { Olly: -6, Nick: -7, Pete: -6 },
    });
  });
});
