const fetchFixtureData = require('./sky-sports-fixtures');
const fetchPlayerData = require('./sky-sports-players');
const fetchScoreData = require('./sky-sports-scores');

module.exports = () => {
  return Promise.all([fetchFixtureData(), fetchPlayerData(), fetchScoreData()])
    .then(([fixtureData, playerData, scoreData]) => {
      return ({ fixtureData, playerData: playerData.summary, playerFixtureData: playerData.fixtures, scoreData })
    })
};
