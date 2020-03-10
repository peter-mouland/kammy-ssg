/* eslint-env jest */
import mockingoose from 'mockingoose';
import mongoose from 'mongoose';
import Chance from 'chance';

import playerSchema from './player.schema';
import { upsertPlayers } from './player';

const chance = new Chance();

const dateDuringGameWeek1 = '2018-08-13 17:00:00';
const date = '2018-08-12 17:30:00';
const date2 = '2018-08-20 17:30:00';

const myDate = new Date(dateDuringGameWeek1);
const RealDate = Date;

const gameWeeks = [
  {
    gameWeek: '1',
    start: '2018-08-10 19:00:00',
    end: '2018-08-18 10:59:59',
  },
  {
    gameWeek: '2',
    start: '2018-08-18 11:00:00',
    end: '2018-08-25 10:59:59',
  },
];

const zeroStats = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const zeroPoints = {
  apps: 0, asts: 0, con: 0, cs: 0, gls: 0, pensv: 0, points: 0, rcard: 0, sb: 0, subs: 0, tb: 0, ycard: 0,
};
const stats1 = [1, 2, 3, 4, 2, 3, 4, 2, 3, 4, 2, 3, 4, 2, 3, 4, 2, 3, 4, 2];
const points1 = {
  apps: 1, asts: 2, con: 3, cs: 2, gls: 4, pensv: 2, points: -4, rcard: 4, sb: 6, subs: 3, tb: 7, ycard: 3,
};
const stats2 = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
const points2 = {
  apps: 5, asts: 5, con: 5, cs: 5, gls: 5, pensv: 5, points: 25, rcard: 5, sb: 10, subs: 5, tb: 10, ycard: 5,
};

describe('upsertPlayers()', () => {
  let saveSpy;
  let findSpy;

  beforeEach(() => {
    saveSpy = jest.spyOn(playerSchema.prototype, 'save');
    findSpy = jest.spyOn(playerSchema, 'findByIdAndUpdate').mockReturnValue({ exec: jest.fn() });
    global.Date = jest.fn((...props) => {
      const mockDate = props.length
        ? new RealDate(...props)
        : new RealDate(myDate);
      return mockDate;
    });
    global.Date.now = jest.fn(() => myDate.getTime());
    Object.assign(Date, RealDate);
  });

  afterEach(() => {
    mockingoose.Player.reset();
    saveSpy.mockReset();
    findSpy.mockReset();
    global.Date = RealDate;
  });

  it('returns a player object', () => {
    const player = {
      _id: mongoose.Types.ObjectId('507f191e810c19729de860ea'),
      code: 1,
    };
    const players = [player];
    mockingoose.Player.toReturn(player, 'save');
    mockingoose.Player.toReturn([], 'aggregate');
    return upsertPlayers({ players, gameWeeks }).then((response) => {
      expect(response[0]).toHaveProperty('_id', player._id);
      expect(response[0]).toHaveProperty('code', player.code);
      expect(response[0]).toHaveProperty('dateCreated');
      expect(response[0]).toHaveProperty('gameWeeks');
      expect(response[0]).toHaveProperty('fixtures');
      expect(response[0]).toHaveProperty('isHidden', false);
      expect(response[0]).toHaveProperty('new', false);
    });
  });

  it('inserts players that DO NOT already exist', () => {
    const player = {
      _id: mongoose.Types.ObjectId('507f191e810c19729de860ea'),
      code: 1,
    };
    const players = [player];
    mockingoose.Player.toReturn(player, 'save');
    mockingoose.Player.toReturn([], 'aggregate');
    return upsertPlayers({ players, gameWeeks }).then(() => {
      expect(playerSchema.prototype.save).toHaveBeenCalled();
      expect(playerSchema.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  it('updates players that DO already exist', () => {
    const player = {
      _id: mongoose.Types.ObjectId('507f191e810c19729de860ea'),
      skySportsClub: chance.word(),
      dateCreated: Date.now(),
      isHidden: false,
      new: false,
      fixtures: [{ stats: [] }],
      code: 2,
    };
    const players = [player];
    mockingoose.Player.toReturn(players, 'aggregate');
    const expected = {
      ...player,
      gameWeeks: [{ fixtures: [], stats: zeroPoints }, { fixtures: [], stats: zeroPoints }],
      season: zeroPoints,
      gameWeek: zeroPoints,
    };
    return upsertPlayers({ players, gameWeeks }).then(() => {
      expect(playerSchema.prototype.save).not.toHaveBeenCalled();
      expect(playerSchema.findByIdAndUpdate).toHaveBeenCalledWith(player._id, expected);
    });
  });

  it('DOES update fixture stats of players that exist, where the update would NOT be zero', () => {
    const player1 = {
      _id: mongoose.Types.ObjectId('217f191e810c19729de860ea'),
      skySportsClub: chance.word(),
      dateCreated: Date.now(),
      isHidden: false,
      new: false,
      fixtures: [{ date, stats: stats1 }],
      code: 21,
    };
    const player2 = {
      _id: mongoose.Types.ObjectId('227f191e810c19729de860ea'),
      skySportsClub: chance.word(),
      dateCreated: Date.now(),
      isHidden: false,
      new: false,
      fixtures: [{ date, stats: stats2 }],
      code: 22,
    };
    const dbPlayer1 = {
      ...player1,
      fixtures: [{ date, stats: zeroStats }],
    };
    const dbPlayer2 = {
      ...player2,
      fixtures: [{ date, stats: zeroStats }],
    };
    const expected1 = {
      ...player1,
      gameWeeks: [{ fixtures: [{ date, stats: points1 }], stats: points1 }, { fixtures: [], stats: zeroPoints }],
      gameWeek: points1,
      season: points1,
    };
    const expected2 = {
      ...player2,
      gameWeeks: [{ fixtures: [{ date, stats: points2 }], stats: points2 }, { fixtures: [], stats: zeroPoints }],
      gameWeek: points2,
      season: points2,
    };
    const players = [player1, player2];
    mockingoose.Player.toReturn([dbPlayer1, dbPlayer2], 'aggregate');
    return upsertPlayers({ players, gameWeeks }).then(() => {
      expect(playerSchema.prototype.save).not.toHaveBeenCalled();
      expect(playerSchema.findByIdAndUpdate).toHaveBeenCalledWith(player1._id, expected1);
      expect(playerSchema.findByIdAndUpdate).toHaveBeenCalledWith(player2._id, expected2);
    });
  });

  it('does NOT update fixture stats of players that exist, where the update WOULD be zero', () => {
    const player1 = {
      _id: mongoose.Types.ObjectId('217f191e810c19729de860ea'),
      skySportsClub: chance.word(),
      dateCreated: Date.now(),
      isHidden: false,
      new: false,
      fixtures: [{
        date,
        stats: zeroStats,
      }],
      code: 21,
    };
    const player2 = {
      _id: mongoose.Types.ObjectId('227f191e810c19729de860ea'),
      skySportsClub: chance.word(),
      dateCreated: Date.now(),
      isHidden: false,
      new: false,
      fixtures: [{
        date,
        stats: zeroStats,
      }],
      code: 22,
    };
    const dbPlayer1 = {
      ...player1,
      fixtures: [{
        date,
        stats: stats1,
      }],
    };
    const dbPlayer2 = {
      ...player2,
      fixtures: [{
        date,
        stats: stats2,
      }],
    };
    const players = [player1, player2];
    mockingoose.Player.toReturn([dbPlayer1, dbPlayer2], 'aggregate');
    const expect1 = {
      ...dbPlayer1,
      gameWeeks: [{ fixtures: [{ date, stats: points1 }], stats: points1 }, { fixtures: [], stats: zeroPoints }],
      season: points1,
      gameWeek: points1,
    };
    const expect2 = {
      ...dbPlayer2,
      gameWeeks: [{ fixtures: [{ date, stats: points2 }], stats: points2 }, { fixtures: [], stats: zeroPoints }],
      season: points2,
      gameWeek: points2,
    };

    return upsertPlayers({ players, gameWeeks }).then(() => {
      expect(playerSchema.prototype.save).not.toHaveBeenCalled();
      expect(playerSchema.findByIdAndUpdate).toHaveBeenCalledWith(player1._id, expect1);
      expect(playerSchema.findByIdAndUpdate).toHaveBeenCalledWith(player2._id, expect2);
    });
  });

  it('saves fixtures even if they have not yet been played', () => {
    const player1 = {
      _id: mongoose.Types.ObjectId('217f191e810c19729de860ea'),
      skySportsClub: chance.word(),
      dateCreated: Date.now(),
      isHidden: false,
      new: false,
      fixtures: [{
        date,
        stats: zeroStats,
      }, {
        date: date2,
        stats: zeroStats,
      }],
      code: 21,
    };
    const dbPlayer1 = {
      ...player1,
      fixtures: [{
        date,
        stats: stats1,
      }, {
        date: date2,
        stats: zeroStats,
      }],
    };
    const players = [player1];
    mockingoose.Player.toReturn([dbPlayer1], 'aggregate');
    const expected1 = {
      ...player1,
      fixtures: dbPlayer1.fixtures,
      gameWeeks: [
        { fixtures: [{ date, stats: points1 }], stats: points1 },
        { fixtures: [{ date: date2, stats: zeroPoints }], stats: zeroPoints }],
      season: points1,
      gameWeek: points1,
    };
    return upsertPlayers({ players, gameWeeks }).then(() => {
      expect(playerSchema.findByIdAndUpdate).toHaveBeenCalledWith(player1._id, expected1);
    });
  });

  it.skip('saves the current gameweek stats, not next-weeks gameweek', () => {});
  it.skip('saves the current gameweek stats, not previous-weeks gameweek', () => {});
});
