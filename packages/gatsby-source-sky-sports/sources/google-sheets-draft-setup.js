const fetch = require('../lib/fetch-google-spreadsheet');
const { spreadsheets } = require('../lib/constants');

module.exports = () => Promise.all([
  fetch(spreadsheets.DRAFT_ID, `/values/premierLeague`),
  fetch(spreadsheets.DRAFT_ID, `/values/championship`),
  fetch(spreadsheets.DRAFT_ID, `/values/leagueOne`),
]).then(([premierLeague, championship, leagueOne]) => ([
  ...premierLeague.map((t) => ({ ...t, division: 'premierLeague'})),
  ...championship.map((t) => ({ ...t, division: 'championship'})),
  ...leagueOne.map((t) => ({ ...t, division: 'leagueOne'}))
]));
