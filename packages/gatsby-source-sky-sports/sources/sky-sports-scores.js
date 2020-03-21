const URL = process.env.NODE_ENV === 'development'
    ? 'https://fantasyfootball.skysports.com/scoring/scores.json'
    : 'https://kammy-proxy.herokuapp.com/skysports/scores';

const scores = () => fetch(URL).then(({ standings }) => standings);

module.exports = scores;
