/* eslint-disable no-console */
const fetchr = require('./fetchr');

exports.handler = async function skySportsPlayers() {
    const res = await fetchr('players');
    return res;
};
