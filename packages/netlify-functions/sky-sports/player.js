/* eslint-disable no-console */
const fetchr = require('./fetchr');

exports.handler = async function skySportsPlayers(event) {
    const res = await fetchr('player', event.queryStringParameters);
    return res;
};
