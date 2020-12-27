const axios = require('axios');

function getUrl(type, params) {
    switch (type) {
        case 'fixtures':
            // return 'https://fantasyfootball.skysports.com/cache/json_fixtures.json';
            return 'https://kammy-proxy.herokuapp.com/skysports/fixtures';
        case 'player':
            // return `https://fantasyfootball.skysports.com/cache/json_player_stats_${params.code}.json`;
            return `https://kammy-proxy.herokuapp.com/skysports/player/${params.code}`;
        case 'players':
            // return `https://fantasyfootball.skysports.com/cache/json_players.json`;
            return `https://kammy-proxy.herokuapp.com/skysports/players`;
        case 'scores':
            // return `https://fantasyfootball.skysports.com/scoring/scores.json`;
            return 'https://kammy-proxy.herokuapp.com/skysports/scores';
        default: {
            console.error('unknown type');
            console.error(type);
            return '';
        }
    }
}

module.exports = async function fetchr(type, params) {
    const res = await axios(getUrl(type, params), { method: 'GET' });
    return {
        statusCode: res.status,
        body: JSON.stringify(res.data, null, 2),
    };
};
