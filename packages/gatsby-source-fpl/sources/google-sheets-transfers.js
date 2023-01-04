const { fetchTransfers } = require('@kammy/helpers.spreadsheet');

module.exports = () =>
    Promise.all([fetchTransfers('premierLeague'), fetchTransfers('championship'), fetchTransfers('leagueOne')]).then(
        ([premierLeague, championship, leagueOne]) => [...premierLeague, ...championship, ...leagueOne],
    );
