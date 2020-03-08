const fetch = require('../lib/fetch-google-spreadsheet');
const { spreadsheets } = require('../lib/constants');

module.exports = (sheet) => fetch(spreadsheets.DRAFT_ID, `/values/${sheet}`);
