const pMap = require('p-map');
const fetch = require('../lib/fetch');

const CONCURRENCY = ['true', true].includes(process.env.IS_LOCAL) ? 25 : 1;
const PLAYERS_URL = 'https://fantasyfootball.skysports.com/cache/json_players.json';

const getFixtures = (code) => fetch(`https://fantasyfootball.skysports.com/cache/json_player_stats_${code}.json`);

const fetchPlayersFull = async (players) => {
    const mapper = async (player) => {
        const fixtures = await getFixtures(player.id);
        return ({ ...player, ...fixtures });
    };
    // return pMap([players[0], mapper, {concurrency: 10 });
    return pMap(players, mapper, { concurrency: CONCURRENCY });
};

const fetchPlayers = async () => {
    const data = await fetch(PLAYERS_URL);
    const playersFixtures = await fetchPlayersFull(data.players);
    return playersFixtures;
};

module.exports = fetchPlayers;
