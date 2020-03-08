const fetch = require('../lib/fetch-google-spreadsheet');
const { spreadsheets } = require('../lib/constants');

module.exports = () => fetch(spreadsheets.SETUP_ID, '/values/GameWeeks');
