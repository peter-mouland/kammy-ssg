/* eslint-disable no-console */
const fetchr = require('./fetchr');

exports.handler = async function skySportsFixtures() {
    const res = await fetchr('fixtures');
    return res;
};
