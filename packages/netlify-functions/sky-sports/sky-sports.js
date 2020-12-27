/* eslint-disable no-console */
const fetchr = require('./fetchr');

exports.handler = async function skySports(event) {
    const body = JSON.parse(event.body);
    const res = await fetchr(body.type, event.queryStringParameters);
    return res;
};
