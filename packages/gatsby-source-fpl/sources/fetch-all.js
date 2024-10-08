const fetchFplData = require('./fpl');
const fetchGoogleGameWeeksData = require('./google-sheets-game-weeks');
const fetchGoogleCupData = require('./google-sheets-cup');
const fetchGoogleDivisionsData = require('./google-sheets-divisions');
const fetchGooglePlayersData = require('./google-sheets-players');
const fetchGoogleTransfersData = require('./google-sheets-transfers');
const fetchGoogleManagersData = require('./google-sheets-managers');
const fetchGoogleDraftData = require('./google-sheets-draft-setup');

module.exports = async () => {
    const googleDivisionData = await fetchGoogleDivisionsData();
    const googlePlayerData = await fetchGooglePlayersData();
    return Promise.all([
        fetchFplData(googlePlayerData),
        fetchGoogleGameWeeksData(),
        fetchGoogleCupData(),
        fetchGoogleDraftData(googleDivisionData),
        fetchGoogleTransfersData(googleDivisionData),
        fetchGoogleManagersData(),
    ]).then(([fplData, googleGameWeekData, googleCupData, googleDraftData, googleTransferData, googleManagerData]) => ({
        fplData,
        googleDivisionData,
        googleGameWeekData,
        googleCupData,
        googleDraftData,
        googleTransferData,
        googlePlayerData,
        googleManagerData,
    }));
};
