const fetch = require('../lib/fetch');

const PLAYERS_URL = 'https://fantasyfootball.skysports.com/cache/json_players.json';

const fetchPlayers = () => fetch(PLAYERS_URL).then((data) => data.players);

module.exports = fetchPlayers;
