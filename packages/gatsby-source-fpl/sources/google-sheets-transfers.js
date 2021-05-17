const { fetchTransfers } = require('@kammy/helpers.spreadsheet');

module.exports = () =>
    Promise.all([
        fetchTransfers('premierLeague'),
        fetchTransfers('championship'),
        fetchTransfers('leagueOne'),
        fetchTransfers('leagueTwo'),
    ]).then(([premierLeague, championship, leagueOne, leagueTwo]) => [
        ...premierLeague,
        ...championship,
        ...leagueOne,
        ...leagueTwo,
    ]);
