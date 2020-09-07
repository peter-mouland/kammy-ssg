/* global fetch */
const parseISO = require('date-fns/parseISO').default;

const fetchr = require('./fetch');
const { spreadsheets } = require('./constants');
const formatTransfers = require('./lib/formatTransfers');
const trimRows = require('./lib/trimRows');

// const PROXY_HOST = 'http://localhost:3000';
const PROXY_HOST = 'https://kammy-proxy.herokuapp.com';

const kammyProxy = async (division, data) => {
    const response = await fetch(`${PROXY_HOST}/spreadsheets/transfers/${division}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.json();
};

module.exports = {
    fetchTransfers: (division, { season } = {}) =>
        fetchr(spreadsheets.TRANSFERS_ID, `/values/${division}`, { season }).then((data) =>
            formatTransfers(data, division),
        ),
    fetchCup: (division = 'cup', { season } = {}) =>
        fetchr(spreadsheets.TRANSFERS_ID, `/values/${division}`, { season }),
    fetchDraft: (worksheet, { season } = {}) =>
        fetchr(spreadsheets.DRAFT_ID, `/values/${worksheet}`, { season }).then(trimRows),
    fetchSetup: (worksheet, { season } = {}) =>
        fetchr(spreadsheets.SETUP_ID, `/values/${worksheet}`, { season }).then(trimRows),
    saveTransfers: async ({ division, data }) => {
        const response = await kammyProxy(division, data);
        return response.map(({ timestamp, ...rest }) => ({ ...rest, timestamp: parseISO(timestamp) }));
    },
};
