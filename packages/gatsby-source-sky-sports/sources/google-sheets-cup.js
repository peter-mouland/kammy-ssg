const fetch = require('../lib/fetch-google-spreadsheet');
const { spreadsheets } = require('../lib/constants');

module.exports = () => fetch(spreadsheets.TRANSFERS_ID, '/values/cup');
