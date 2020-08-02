const routes = require('./routes');

let config = {};

const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = process.env.PORT || 8082;

const setConfig = () => {
    // set prod / default env here
    config = {
        NODE_ENV,
        PORT,
        routes,
        divisionLabels: ['Premier League', 'Championship', 'League One', 'League Two'],
        divisionSheets: {
            'Premier League': 'premierLeague',
            Championship: 'championship',
            'League One': 'leagueOne',
            'League Two': 'leagueTwo',
        },
    };

    // explicitly check vars so that webpack can help us
    if (config.NODE_ENV === 'development') {
    // set dev envs here
        config.DEBUG = true;
        config.isPreview = true;
    }
};

if (Object.keys(config).length === 0) {
    setConfig();
}

module.exports = config;
