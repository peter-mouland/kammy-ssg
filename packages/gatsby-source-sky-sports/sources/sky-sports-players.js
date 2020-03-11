const pMap = require('p-map');
const fetch = require('../lib/fetch');

const PLAYERS_URL = 'https://fantasyfootball.skysports.com/cache/json_players.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getFixtures = (code) => fetch(`https://fantasyfootball.skysports.com/cache/json_player_stats_${code}.json`);

const fetchPlayersFull = async (players) => {
  const mapper = async (player) => {
    const fixtures = await getFixtures(player.id);
    return ({...player, ...fixtures});
  };
  // return pMap([players[0], mapper, {concurrency: 10 });
  return pMap(players, mapper, { concurrency: 20 });
};

const fetchPlayers = async () => {
  const data = await fetch(PLAYERS_URL);
  const playersFixtures = await fetchPlayersFull(data.players);
  return playersFixtures;
};

module.exports = fetchPlayers;
