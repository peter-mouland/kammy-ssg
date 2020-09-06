/* global fetch */
const pMap = require('p-map');

const CONCURRENCY = 25; // ['true', true].includes(process.env.IS_LOCAL) ? 25 : 1;
const URL =
    process.env.NODE_ENV === 'development'
        ? 'https://fantasyfootball.skysports.com/cache/json_players.json'
        : 'https://kammy-proxy.herokuapp.com/skysports/players';
// ? 'http://localhost:8888/.netlify/functions/sky-sports-players'

const getPlayerUrl = (code) =>
    process.env.NODE_ENV === 'development'
        ? `https://fantasyfootball.skysports.com/cache/json_player_stats_${code}.json`
        : `https://kammy-proxy.herokuapp.com/skysports/player/${code}`;

const getFixtures = (code, opts) => fetch(getPlayerUrl(code), opts);

const fetchPlayersFull = async (players, opts) => {
    const mapper = async (player) => {
        const fixtures = await getFixtures(player.id, opts);
        return { ...player, ...fixtures };
    };
    // return pMap([players[0], mapper, {concurrency: 10 });
    return pMap(players, mapper, { concurrency: CONCURRENCY });
};

const fetchPlayers = async ({ season } = {}) => {
    const data = await fetch(URL, { season });
    const playersFixtures = await fetchPlayersFull(data.players, { season });
    return playersFixtures;
};

module.exports = fetchPlayers;
