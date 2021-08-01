const { fetchSetup } = require('@kammy/helpers.spreadsheet');

module.exports = () =>
    Promise.all([
        fetchSetup('premierLeague'),
        fetchSetup('championship'),
        fetchSetup('leagueOne'),
        // fetchSetup('leagueTwo'),
    ]).then(([premierLeague, championship, leagueOne]) => [
        ...premierLeague.map((row) => ({ ...row, division: 'premierLeague' })),
        ...championship.map((row) => ({ ...row, division: 'championship' })),
        ...leagueOne.map((row) => ({ ...row, division: 'leagueOne' })),
        // ...leagueTwo.map((row) => ({ ...row, division: 'leagueTwo' })),
    ]);
