const URL = process.env.NODE_ENV === 'development'
    ? 'https://fantasyfootball.skysports.com/cache/json_fixtures.json'
    : 'https://kammy-proxy.herokuapp.com/skysports/fixtures';
// ? 'http://localhost:8888/.netlify/functions/sky-sports-fitures'

const fixtures = () => fetch(URL).then(({ fixtures: data }) => data);

module.exports = fixtures;
