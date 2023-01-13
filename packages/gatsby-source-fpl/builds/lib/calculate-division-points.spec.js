/* eslint-disable */
const getTeamPoints = require('./calculate-division-points');

const teams = {
  "Olly":[{
    teamPos: 'GK',
    "gameWeekStats":{"points": 0},
    seasonToGameWeek: {"points":0},
  },{
    teamPos: 'SUB',
    "gameWeekStats":{"points":0},
    seasonToGameWeek: {"points":0},
  },{
    teamPos: 'FB',
    "gameWeekStats":{"points":0},
    seasonToGameWeek: {"points":0},
  },{
    teamPos: 'FB',
    "gameWeekStats":{"points":0},
    seasonToGameWeek: {"points":0},
  }],
  "Nick":[{
    teamPos: 'GK',
    "gameWeekStats":{"points":3},
    seasonToGameWeek: {"points":3},
  },{
    teamPos: 'SUB',
    "gameWeekStats":{"points":3},
    seasonToGameWeek: {"points":3},
  },{
    teamPos: 'FB',
    "gameWeekStats":{"points":3},
    seasonToGameWeek: {"points":3},
  },{
    teamPos: 'FB',
    "gameWeekStats":{"points":3},
    seasonToGameWeek: {"points":3},
  }],
};

describe('getTeamPoints()', () => {
  describe('points() calculations based on the given intGameWeek', () => {
    it('should return the aggregate POSITION (gks) points for the gameWeekPoints and seasonPoints', () => {
      const divisionPoints = getTeamPoints(teams["Olly"]);
      expect(divisionPoints).toHaveProperty('gks', {
          gameWeekPoints: 0,
          seasonPoints: 0,
      });
    });
    it('should return the aggregate POSITION (FB) points for the gameWeekPoints and seasonPoints', () => {
      const divisionPoints = getTeamPoints(teams["Olly"]);
      expect(divisionPoints).toHaveProperty('fb', {
          gameWeekPoints: 0,
          seasonPoints: 0,
      });
    });

    it('should calculate the total points for all positions', () => {
      const divisionPoints = getTeamPoints(teams["Olly"]);
      expect(divisionPoints).toHaveProperty('total', {
          gameWeekPoints: 0,
          seasonPoints: 0,
      });
    });

    it('should return the aggregate POSITION (GK/SUB) points for the gameWeekPoints and seasonPoints', () => {
      const divisionPoints = getTeamPoints(
          [{
              teamPos: 'GK',
              "gameWeekStats":{"points": 1},
              seasonToGameWeek: {"points":1},
          },{
              teamPos: 'SUB',
              "gameWeekStats":{"points":1},
              seasonToGameWeek: {"points":1},
          }]
      );
      expect(divisionPoints).toHaveProperty('gks', {
        gameWeekPoints: 2,
        seasonPoints: 2,
      });
    });

    it('should return the aggregate POSITION (fb) points for the gameWeekPoints and seasonPoints', () => {
      const divisionPoints = getTeamPoints([{
          teamPos: 'FB',
          "gameWeekStats":{"points":1},
          seasonToGameWeek: {"points":1},
      },{
          teamPos: 'FB',
          "gameWeekStats":{"points":1},
          seasonToGameWeek: {"points":1},
      }]);
      expect(divisionPoints).toHaveProperty('fb', {
        gameWeekPoints: 2,
        seasonPoints: 2,
      });
    });

    it('should return the empty positions if they do not match to prevent the app from crashing', () => {
      const divisionPoints = getTeamPoints(teams["Olly"]);
      expect(divisionPoints).toHaveProperty('cb', {
        gameWeekPoints: 0,
        seasonPoints: 0,
      });
      expect(divisionPoints).toHaveProperty('am', {
        gameWeekPoints: 0,
        seasonPoints: 0,
      });
      expect(divisionPoints).toHaveProperty('str', {
        gameWeekPoints: 0,
        seasonPoints: 0,
      });
    });

    it('should calculate the total points for all positions', () => {
      const divisionPoints = getTeamPoints([{
          teamPos: 'GK',
          "gameWeekStats":{"points": 1},
          seasonToGameWeek: {"points":1},
      },{
          teamPos: 'SUB',
          "gameWeekStats":{"points":1},
          seasonToGameWeek: {"points":1},
      },{
          teamPos: 'FB',
          "gameWeekStats":{"points":1},
          seasonToGameWeek: {"points":1},
      },{
          teamPos: 'FB',
          "gameWeekStats":{"points":1},
          seasonToGameWeek: {"points":1},
      }]);
      expect(divisionPoints).toHaveProperty('total', {
        gameWeekPoints: 4,
        seasonPoints: 4,
      });
    });

      it('should calculate the total points for all positions for multiple gameweeks', () => {
          const divisionPoints = getTeamPoints([{
              teamPos: 'GK',
              "gameWeekStats":{"points": 1},
              seasonToGameWeek: {"points":1},
          },{
              teamPos: 'SUB',
              "gameWeekStats":{"points":1},
              seasonToGameWeek: {"points":1},
          },{
              teamPos: 'FB',
              "gameWeekStats":{"points":1},
              seasonToGameWeek: {"points":1},
          },{
              teamPos: 'FB',
              "gameWeekStats":{"points":1},
              seasonToGameWeek: {"points":1},
          },{
              teamPos: 'GK',
              "gameWeekStats":{"points": 1},
              seasonToGameWeek: {"points":1},
          },{
              teamPos: 'SUB',
              "gameWeekStats":{"points":1},
              seasonToGameWeek: {"points":1},
          },{
              teamPos: 'FB',
              "gameWeekStats":{"points":1},
              seasonToGameWeek: {"points":1},
          },{
              teamPos: 'FB',
              "gameWeekStats":{"points":1},
              seasonToGameWeek: {"points":1},
          }]);
          expect(divisionPoints).toHaveProperty('total', {
              gameWeekPoints: 8,
              seasonPoints: 8,
          });
      });
  });
});
