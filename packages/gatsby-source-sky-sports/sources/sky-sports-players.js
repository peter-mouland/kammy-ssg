const fetch = require('../lib/fetch');

const PLAYERS_URL = 'https://fantasyfootball.skysports.com/cache/json_players.json';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getFixtures = (code) => fetch(`https://fantasyfootball.skysports.com/cache/json_player_stats_${code}.json`);

const fetchPlayersFull = async (players) => {
  // const promises = [players[0]].map(async (player, i) => {
  const promises = players.map(async (player, i) => {
    await delay((i * 50));
    const fixtures = await getFixtures(player.id);
    return ({...player, ...fixtures});
  });
  return Promise.all(promises);
};

const fetchPlayers = async () => {
  const data = await fetch(PLAYERS_URL);
  const playersFixtures = await fetchPlayersFull(data.players);
  return playersFixtures;
};

module.exports = fetchPlayers;
