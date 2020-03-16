const fetch = require('../lib/fetch');

const FIXTURES_URL = 'https://fantasyfootball.skysports.com/cache/json_fixtures.json';

const fixtures = () => fetch(FIXTURES_URL).then(({ fixtures: data }) => data);

module.exports = fixtures;
