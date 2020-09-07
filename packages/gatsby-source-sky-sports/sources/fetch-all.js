const fetchSkySportsFixtureData = require('./sky-sports-fixtures');
const fetchSkySportsPlayerData = require('./sky-sports-players');
const fetchSkySportsScoreData = require('./sky-sports-scores');
const fetchGoogleGameWeeksData = require('./google-sheets-game-weeks');
const fetchGoogleCupData = require('./google-sheets-cup');
const fetchGoogleDivisionsData = require('./google-sheets-divisions');
const fetchGooglePlayersData = require('./google-sheets-players');
const fetchGoogleTransfersData = require('./google-sheets-transfers');
const fetchGoogleManagersData = require('./google-sheets-managers');
const fetchGoogleDraftData = require('./google-sheets-draft-setup');

module.exports = () =>
    Promise.all([
        fetchSkySportsFixtureData(),
        fetchSkySportsPlayerData(),
        fetchSkySportsScoreData(),
        fetchGoogleGameWeeksData(),
        fetchGoogleCupData(),
        fetchGoogleTransfersData(),
        fetchGooglePlayersData(),
        fetchGoogleDivisionsData(),
        fetchGoogleManagersData(),
        fetchGoogleDraftData(),
        fetchSkySportsFixtureData({ season: 1920 }),
        fetchSkySportsPlayerData({ season: 1920 }),
        fetchGoogleGameWeeksData({ season: 1920 }),
    ]).then(
        ([
            skySportsFixtureData,
            skySportsPlayerData,
            skySportsScoreData,
            googleGameWeekData,
            googleCupData,
            googleTransferData,
            googlePlayerData,
            googleDivisionData,
            googleManagerData,
            googleDraftData,
            skySportsFixtureDataFixtures,
            skySportsPlayerDataFixtures,
            googleGameWeekDataFixtures,
        ]) => ({
            skySportsFixtureData,
            skySportsPlayerData,
            skySportsScoreData,
            googleGameWeekData,
            googleCupData,
            googleTransferData,
            googlePlayerData,
            googleDivisionData,
            googleManagerData,
            googleDraftData,
            skySportsFixtureDataFixtures,
            skySportsPlayerDataFixtures,
            googleGameWeekDataFixtures,
        }),
    );
