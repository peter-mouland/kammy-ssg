const fetch = require('../lib/fetch');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getFixtures = (code) => fetch(`https://fantasyfootball.skysports.com/cache/json_player_stats_${code}.json`);

const fetchPlayersFull = async (players) => {
  const promises = players.map(async (player, i) => {
    await delay((i * 50));
    const fixtures = await getFixtures(player.id);
    return ({ id: player.id, ...fixtures});
  });
  return Promise.all(promises);
};

const fetchPlayers = async (players) => {
  const playersFixtures = await fetchPlayersFull(players);
  return playersFixtures;
};

module.exports = fetchPlayers;
