const http = require('https');
const path = require('path');
const fs = require('fs');

const logger = require('./log');
const constants = require('./constants');

const getFixturePath = (url, season = 'new') => {
    const slimUrl = url
        .replace(
            /https:\/\/kammy-proxy.herokuapp.com\/skysports\/player\/(.*)/,
            'https://fantasyfootball.skysports.com/cache/json_player_stats_$1.json',
        )
        .replace(
            'https://kammy-proxy.herokuapp.com/skysports/players',
            'https://fantasyfootball.skysports.com/cache/json_players.json',
        )
        .replace(/\//g, '-')
        .replace(constants.spreadsheets.ACCESS_KEY, '')
        .replace(constants.spreadsheets.SETUP_ID, 'SETUP')
        .replace(constants.spreadsheets.TRANSFERS_ID, 'TRANSFERS')
        .replace('?key=', '.json');
    return path.join(__dirname, '.', 'fixtures', String(season), slimUrl);
};

const { FIXTURES, SAVE } = process.env;
console.log({ FIXTURES, SAVE });

const fetch = (URL, { season } = {}) => {
    const fixturesPath = getFixturePath(URL, FIXTURES || season);
    if (FIXTURES || season) {
        try {
            const fixture = fs.readFileSync(fixturesPath, 'utf-8');
            const json = JSON.parse(fixture);
            return new Promise((resolve) => resolve(json));
        } catch (e) {
            // fixture does not exist
            logger.info(`fixture not exist: ${fixturesPath}`);
        }
    }
    return new Promise((resolve, reject) => {
        logger.info(`fetch: ${URL}`);
        const req = http.get(URL, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (SAVE) {
                        fs.writeFileSync(fixturesPath, data, 'utf-8');
                    }
                    resolve(json);
                } catch (e) {
                    logger.error(URL);
                    logger.error(data);
                    throw Error(e);
                }
            });
        });

        req.on('error', (e) => {
            reject(e.message);
        });
    });
};

module.exports = fetch;
