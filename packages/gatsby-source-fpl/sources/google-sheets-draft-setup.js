const { fetchSetup } = require('@kammy/helpers.spreadsheet');

module.exports = () =>
    Promise.all([fetchSetup('premierLeague'), fetchSetup('championship'), fetchSetup('leagueOne')]).then(
        ([premierLeague, championship, leagueOne]) => [
            ...premierLeague.map((row) => ({ ...row, divisionId: 'premierLeague' })),
            ...championship.map((row) => ({ ...row, divisionId: 'championship' })),
            ...leagueOne.map((row) => ({ ...row, divisionId: 'leagueOne' })),
        ],
    );
