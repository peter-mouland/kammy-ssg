const fetchr = require('./fetch');
const { spreadsheets } = require('./constants');
const formatTransfers = require('./lib/formatTransfers');

const kammyProxy = async (division, data) => {
    const response = await fetch(`http://kammy-proxy.herokuapp.com/spreadsheets/transfers/${division}`, {
    // const response = await fetch(`http://localhost:3000/spreadsheets/transfers/${division}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.json();
};

module.exports = {
    fetchTransfers: (division) => (
        fetchr(spreadsheets.TRANSFERS_ID, `/values/${division}`).then((data) => formatTransfers(data, division))
    ),
    fetchCup: (division = 'cup') => fetchr(spreadsheets.TRANSFERS_ID, `/values/${division}`),
    fetchDraft: (worksheet) => fetchr(spreadsheets.DRAFT_ID, `/values/${worksheet}`),
    fetchSetup: (worksheet) => fetchr(spreadsheets.SETUP_ID, `/values/${worksheet}`),
    saveTransfers: ({ division, data }) => kammyProxy(division, data),
};
