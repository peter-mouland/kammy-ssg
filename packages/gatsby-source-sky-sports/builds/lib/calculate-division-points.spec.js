/* eslint-disable */
import getTeamPoints from './calculate-division-points';

const teams = { 'Olly': 'Manager details', 'Nick': 'Manager details' };
const managers = Object.keys(teams);
const managersSeason = {
  "Olly":[{
    teamPos: 'GK',
    gameWeeks: [ {"gameWeekStats":{"points":0}}, {"gameWeekStats":{"points":1}} ],
    seasonToGameWeek: [ {"points":0}, {"points":1} ],
    seasonStats: {"points":1},
  },{
    teamPos: 'SUB',
    gameWeeks: [ {"gameWeekStats":{"points":0}}, {"gameWeekStats":{"points":1}} ],
    seasonToGameWeek: [ {"points":0}, {"points":1} ],
    seasonStats: {"points":1},
  },{
    teamPos: 'FB',
    gameWeeks: [ {"gameWeekStats":{"points":0}}, {"gameWeekStats":{"points":1}} ],
    seasonToGameWeek: [ {"points":0}, {"points":1} ],
    seasonStats: {"points":2},
  },{
    teamPos: 'FB',
    gameWeeks: [ {"gameWeekStats":{"points":0}}, {"gameWeekStats":{"points":1}} ],
    seasonToGameWeek: [ {"points":0}, {"points":1} ],
    seasonStats: {"points":2},
  }],
  "Nick":[{
    teamPos: 'GK',
    gameWeeks: [ {"gameWeekStats":{"points":3}}, {"gameWeekStats":{"points":4}} ],
    seasonToGameWeek: [ {"points":3}, {"points":4} ],
    seasonStats: {"points":1},
  },{
    teamPos: 'SUB',
    gameWeeks: [ {"gameWeekStats":{"points":3}}, {"gameWeekStats":{"points":4}} ],
    seasonToGameWeek: [ {"points":3}, {"points":4} ],
    seasonStats: {"points":1},
  },{
    teamPos: 'FB',
    gameWeeks: [ {"gameWeekStats":{"points":3}}, {"gameWeekStats":{"points":4}} ],
    seasonToGameWeek: [ {"points":3}, {"points":4} ],
    seasonStats: {"points":7},
  },{
    teamPos: 'FB',
    gameWeeks: [ {"gameWeekStats":{"points":3}}, {"gameWeekStats":{"points":4}} ],
    seasonToGameWeek: [ {"points":3}, {"points":4} ],
    seasonStats: {"points":7},
  }],
};

describe('getTeamPoints()', () => {
  it('should return an array the length of the teams', () => {
    const divisionPoints = getTeamPoints(managers, managersSeason, 0);
    expect(divisionPoints).toHaveLength(2);
  });

  it('should return the manager details', () => {
    const divisionPoints = getTeamPoints(managers, managersSeason, 0);
    expect(divisionPoints[0]).toHaveProperty('manager', 'Olly');
  });

  describe('points() calculations based on the given intGameWeek', () => {
    it('should return the aggregate POSITION (GK/SUB) points for the gameWeek and season', () => {
      const divisionPoints = getTeamPoints(managers, managersSeason, 0);
      expect(divisionPoints[0]).toHaveProperty('points');
      expect(divisionPoints[0].points).toHaveProperty('GK / SUB', {
          gameWeek: 0,
          season: 0,
      });
    });
    it('should return the aggregate POSITION (FB) points for the gameWeek and season', () => {
      const divisionPoints = getTeamPoints(managers, managersSeason, 0);
      expect(divisionPoints[0]).toHaveProperty('points');
      expect(divisionPoints[0].points).toHaveProperty('FB', {
          gameWeek: 0,
          season: 0,
      });
    });

    it('should calculate the total points for all positions', () => {
      const divisionPoints = getTeamPoints(managers, managersSeason, 0);
      expect(divisionPoints[0].points).toHaveProperty('total', {
          gameWeek: 0,
          season: 0,
      });
    });

    it('should return the aggregate POSITION (GK/SUB) points for the gameWeek and season', () => {
      const divisionPoints = getTeamPoints(managers, managersSeason, 1);
      expect(divisionPoints[0]).toHaveProperty('points');
      expect(divisionPoints[0].points).toHaveProperty('GK / SUB', {
        gameWeek: 2,
        season: 2,
      });
    });

    it('should return the aggregate POSITION (FB) points for the gameWeek and season', () => {
      const divisionPoints = getTeamPoints(managers, managersSeason, 1);
      expect(divisionPoints[0]).toHaveProperty('points');
      expect(divisionPoints[0].points).toHaveProperty('FB', {
        gameWeek: 2,
        season: 2,
      });
    });

    it('should return the empty positions if they do not match to prevent the app from crashing', () => {
      const divisionPoints = getTeamPoints(managers, managersSeason, 1);
      expect(divisionPoints[0]).toHaveProperty('points');
      expect(divisionPoints[0].points).toHaveProperty('CB', {
        gameWeek: 0,
        season: 0,
      });
      expect(divisionPoints[0].points).toHaveProperty('AM', {
        gameWeek: 0,
        season: 0,
      });
      expect(divisionPoints[0].points).toHaveProperty('STR', {
        gameWeek: 0,
        season: 0,
      });
    });

    it('should calculate the total points for all positions', () => {
      const divisionPoints = getTeamPoints(managers, managersSeason, 1);
      expect(divisionPoints[0].points).toHaveProperty('total', {
        gameWeek: 4,
        season: 4,
      });
    });
  });
});
