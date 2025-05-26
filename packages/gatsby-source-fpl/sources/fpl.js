const pMap = require('p-map');

const CONCURRENCY = 1; // ['true', true].includes(process.env.IS_LOCAL) ? 25 : 1;
const bootstrapURL = 'https://fantasy.premierleague.com/api/bootstrap-static/';
// process.env.NODE_ENV === 'development'
//     ? 'https://fantasy.premierleague.com/api/bootstrap-static/'
//     : 'https://kammy-proxy.herokuapp.com/fpl/bootstrap-static';

const getElementsUrl = (code) => `https://fantasy.premierleague.com/api/element-summary/${code}/`;
// process.env.NODE_ENV === 'development'
//     ? `https://fantasy.premierleague.com/api/element-summary/${code}/`
//     : `https://kammy-proxy.herokuapp.com/fpl/element-summary/${code}`;

const fixturesURL = 'https://fantasy.premierleague.com/api/fixtures/';
// process.env.NODE_ENV === 'development'
//     ? 'https://fantasy.premierleague.com/api/fixtures'
// ? 'http://localhost:8888/.netlify/functions/sky-sports-fitures'

const fetchPlayersFixtures = async (googlePlayerData, elementsById) => {
    const mapper = async (element) => {
        if (!element.id) {
            console.error(`error id unknown `, element);
            // return;
        }
        const { fixtures, history } = await fetch(getElementsUrl(element.id));
        return { ...elementsById[element.id], fixtures, stats: history };
    };
    return pMap(googlePlayerData, mapper, { concurrency: CONCURRENCY });
};

const fetchFplData = async (googlePlayerData) => {
    // eslint-disable-next-line camelcase
    const { events, elements, teams, element_types } = await fetch(bootstrapURL);
    const teamsByCode = teams.reduce((prev, t) => ({ ...prev, [t.code]: t }), {});
    const elementsById = elements.reduce((prev, e) => ({ ...prev, [e.id]: e }), {});
    const elementTypesById = element_types.reduce((prev, e) => ({ ...prev, [e.id]: e }), {});
    const fixtures = await fetch(fixturesURL);
    const elementsWithFixturesAndStats = await fetchPlayersFixtures(googlePlayerData, elementsById);
    return {
        events,
        elements: elementsWithFixturesAndStats,
        elementTypesById,
        teams,
        teamsByCode,
        fixtures,
        element_types,
    };
};

module.exports = fetchFplData;
