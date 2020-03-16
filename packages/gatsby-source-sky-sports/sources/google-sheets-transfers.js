const fetch = require('../lib/fetch-google-spreadsheet');
const { spreadsheets } = require('../lib/constants');

module.exports = () => Promise.all([
    fetch(spreadsheets.TRANSFERS_ID, '/values/premierLeague'),
    fetch(spreadsheets.TRANSFERS_ID, '/values/championship'),
    fetch(spreadsheets.TRANSFERS_ID, '/values/leagueOne'),
]).then(([premierLeague, championship, leagueOne]) => ([
    ...premierLeague.map((row) => ({ ...row, division: 'premierLeague' })),
    ...championship.map((row) => ({ ...row, division: 'championship' })),
    ...leagueOne.map((row) => ({ ...row, division: 'leagueOne' })),
]));
