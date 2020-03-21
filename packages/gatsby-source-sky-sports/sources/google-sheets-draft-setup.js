const { fetchDraft } = require('@kammy/helpers.fetch-spreadsheet');

module.exports = () => Promise.all([
    fetchDraft('premierLeague'),
    fetchDraft('championship'),
    fetchDraft('leagueOne'),
]).then(([premierLeague, championship, leagueOne]) => ([
    ...premierLeague.map((row) => ({ ...row, division: 'premierLeague' })),
    ...championship.map((row) => ({ ...row, division: 'championship' })),
    ...leagueOne.map((row) => ({ ...row, division: 'leagueOne' })),
]));
