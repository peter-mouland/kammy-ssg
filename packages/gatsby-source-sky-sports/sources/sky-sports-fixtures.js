const fetch = require('../lib/fetch');

const URL = process.env.NODE_ENV === 'development'
    ? 'https://fantasyfootball.skysports.com/cache/json_fixtures.json'
    : 'https://kammy-proxy.herokuapp.com/skysports/fixtures';

const fixtures = () => fetch(URL).then(({ fixtures: data }) => data);

module.exports = fixtures;
