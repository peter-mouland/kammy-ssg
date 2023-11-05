const parseISOimport = require('date-fns/parseISO');

const fetchr = require('./fetch');
const { spreadsheets } = require('./constants');
const formatTransfers = require('./lib/formatTransfers');
const trimRows = require('./lib/trimRows');

// const PROXY_HOST = 'http://localhost:3000';
// const PROXY_HOST = 'https://kammy-proxy.herokuapp.com';
const PROXY_HOST = 'https://kammy-proxy.vercel.app/api';
const parseISO = parseISOimport.default || parseISOimport;

const kammyProxy = async (api, data) => {
    const response = await fetch(`${PROXY_HOST}/spreadsheets/${api}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.json();
};

module.exports = {
    spreadsheets,
    fetchTransfers: (divisionID, { season } = {}) =>
        fetchr(spreadsheets.TRANSFERS_ID, `/values/${divisionID}`, { season }).then((data) =>
            formatTransfers(data, divisionID),
        ),
    fetchCupSubmissions: ({ season } = {}) => fetchr(spreadsheets.TRANSFERS_ID, `/values/cupSubmissions`, { season }),
    fetchCup: ({ season } = {}) => fetchr(spreadsheets.TRANSFERS_ID, `/values/cup`, { season }),
    fetchSetup: (worksheet, { season } = {}) =>
        fetchr(spreadsheets.SETUP_ID, `/values/${worksheet}`, { season }).then(trimRows),
    saveTransfers: async ({ division, data }) => {
        const response = await kammyProxy(`transfers/${division}`, data);
        return response.map(({ timestamp, ...rest }) => ({ ...rest, timestamp: parseISO(timestamp) }));
    },
    saveCupTeam: async ({ data }) => {
        const response = await kammyProxy('cup', data);
        return response.map(({ timestamp, ...rest }) => ({ ...rest, timestamp: parseISO(timestamp) }));
    },
};
