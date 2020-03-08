const fetch = require('../lib/fetch');

const LIVE_SCORES_URL = 'https://fantasyfootball.skysports.com/scoring/scores.json';

const scores = () => fetch(LIVE_SCORES_URL).then(({ standings }) => standings);

module.exports = scores;
