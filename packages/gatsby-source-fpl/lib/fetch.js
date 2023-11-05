const http = require('https');
const path = require('path');
const fs = require('fs');
const { spreadsheets } = require('@kammy/helpers.spreadsheet');

const logger = require('./log');

const getFixturePath = (url, season = '2223') => {
    let slimUrl = url
        .replace('https://fantasy.premierleague.com/api/', '')
        .replace('https://sheets.googleapis.com/v4/spreadsheets/', '')
        .replace(spreadsheets.ACCESS_KEY, '')
        .replace(spreadsheets.SETUP_ID, 'setup')
        .replace(spreadsheets.TRANSFERS_ID, 'transfers')
        .replace('?key=', '.json');
    if (slimUrl.endsWith('/')) {
        slimUrl = slimUrl.replace(/\/$/, '.json');
    }
    const subdir = url.includes('google') ? 'spreadsheets' : 'fpl';
    return path.join(__dirname, '..', 'fixtures', String(season), subdir, slimUrl);
};

const { FIXTURES, SAVE } = process.env;

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
    }
}

const fetch = async (URL, { season } = {}) => {
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
                        logger.info('Saving: ', fixturesPath);
                        ensureDirectoryExistence(fixturesPath);
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
