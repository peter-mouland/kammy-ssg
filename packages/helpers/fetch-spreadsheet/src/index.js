const fetch = require('./fetch');
const { spreadsheets } = require('./constants');
const formatTransfers = require('./lib/formatTransfers');

module.exports = {
    fetchTransfers: (division) => (
        fetch(spreadsheets.TRANSFERS_ID, `/values/${division}`).then((data) => formatTransfers(data, division))
    ),
    fetchCup: (division = 'cup') => fetch(spreadsheets.TRANSFERS_ID, `/values/${division}`),
    fetchDraft: (worksheet) => fetch(spreadsheets.DRAFT_ID, `/values/${worksheet}`),
    fetchSetup: (worksheet) => fetch(spreadsheets.SETUP_ID, `/values/${worksheet}`),
};
