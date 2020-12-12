/* eslint-disable no-console */
const axios = require('axios');

function getUrl(type, params) {
    switch (type) {
        case 'fixtures':
            return 'https://fantasyfootball.skysports.com/cache/json_fixtures.json';
        case 'player':
            return `https://fantasyfootball.skysports.com/cache/json_player_stats_${params.code}.json`;
        case 'players':
            return `https://fantasyfootball.skysports.com/cache/json_players.json`;
        case 'scores':
            return `https://fantasyfootball.skysports.com/scoring/scores.json`;
        default: {
            console.error('unknown type');
            console.error(type);
            return '';
        }
    }
}

// eslint-disable-next-line no-unused-vars
exports.handler = async function skySportsScores(event, context) {
    const body = JSON.parse(event.body);
    const res = await axios(getUrl(body.type, body.params), { method: 'GET' });
    console.log(res.data);
    return {
        statusCode: res.status,
        body: JSON.stringify(res.data, null, 2),
    };
};
