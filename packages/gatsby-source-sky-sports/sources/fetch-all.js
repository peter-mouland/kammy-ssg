const fetchSkySportsFixtureData = require('./sky-sports-fixtures');
const fetchSkySportsPlayerData = require('./sky-sports-players');
const fetchSkySportsScoreData = require('./sky-sports-scores');
const fetchGoogleGameWeeksData = require('./google-sheets-game-weeks');
const fetchGoogleCupData = require('./google-sheets-cup');
const fetchGoogleDivisionsData = require('./google-sheets-divisions');
const fetchGoogleDraftSetupData = require('./google-sheets-draft-setup');
const fetchGooglePlayersData = require('./google-sheets-players');
const fetchGoogleTransfersData = require('./google-sheets-transfers');

module.exports = () => {
  return Promise.all([
    fetchSkySportsFixtureData(),
    fetchSkySportsPlayerData(),
    fetchSkySportsScoreData(),
    fetchGoogleGameWeeksData(),
    fetchGoogleCupData(),
    // fetchGoogleDivisionsData(),
    // fetchGooglePlayersData(),
  ])
    .then(([fixtureData, playerData, scoreData, googleGameWeekData, googleCupData, googleDivisionData, googlePlayerData ]) => {
      return {
        fixtureData,
        playerData,
        scoreData,
        googleGameWeekData,
        googleCupData,
      };
    })
};
