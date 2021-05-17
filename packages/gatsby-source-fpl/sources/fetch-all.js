const fetchFplData = require('./fpl');
const fetchGoogleGameWeeksData = require('./google-sheets-game-weeks');
const fetchGoogleCupData = require('./google-sheets-cup');
const fetchGoogleDivisionsData = require('./google-sheets-divisions');
const fetchGooglePlayersData = require('./google-sheets-players');
const fetchGoogleTransfersData = require('./google-sheets-transfers');
const fetchGoogleManagersData = require('./google-sheets-managers');
const fetchGoogleDraftData = require('./google-sheets-draft-setup');

module.exports = () =>
    Promise.all([
        fetchFplData(),
        fetchGoogleGameWeeksData(),
        fetchGoogleCupData(),
        fetchGoogleTransfersData(),
        fetchGooglePlayersData(),
        fetchGoogleDivisionsData(),
        fetchGoogleManagersData(),
        fetchGoogleDraftData(),
    ]).then(
        ([
            fplData,
            googleGameWeekData,
            googleCupData,
            googleTransferData,
            googlePlayerData,
            googleDivisionData,
            googleManagerData,
            googleDraftData,
        ]) => ({
            fplData,
            googleGameWeekData,
            googleCupData,
            googleTransferData,
            googlePlayerData,
            googleDivisionData,
            googleManagerData,
            googleDraftData,
        }),
    );
