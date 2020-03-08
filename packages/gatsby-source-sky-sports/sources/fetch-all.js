const fetchSkySportsFixtureData = require('./sky-sports-fixtures');
const fetchSkySportsPlayerData = require('./sky-sports-players');
const fetchSkySportsPlayerStatsData = require('./sky-sports-player-stats');
const fetchSkySportsScoreData = require('./sky-sports-scores');
const fetchGoogleGameWeeksData = require('./google-sheets-game-weeks');
const fetchGoogleCupData = require('./google-sheets-cup');
const fetchGoogleDivisionsData = require('./google-sheets-divisions');
const fetchGooglePlayersData = require('./google-sheets-players');
const fetchGoogleTransfersData = require('./google-sheets-transfers');
const fetchGoogleManagersData = require('./google-sheets-managers');

module.exports = () => {
  return Promise.all([
    fetchSkySportsFixtureData(),
    fetchSkySportsPlayerData(),
    fetchSkySportsScoreData(),
    fetchGoogleGameWeeksData(),
    fetchGoogleCupData(),
    fetchGoogleTransfersData(),
    fetchGooglePlayersData(),
    fetchGoogleDivisionsData(),
    fetchGoogleManagersData(),
  ])
    .then(([fixtureData, playerData, scoreData, googleGameWeekData, googleCupData, googleTransferData, googlePlayerData, googleDivisionData, googleManagerData ]) => {
      return {
        fixtureData,
        playerData,
        scoreData,
        googleGameWeekData,
        googleCupData,
        googleTransferData,
        googlePlayerData,
        googleDivisionData,
        googleManagerData,
      };
    }).then(async (data) => ({
      ...data,
      skyPlayerStatsData: await fetchSkySportsPlayerStatsData(data.playerData)
    }));
};
