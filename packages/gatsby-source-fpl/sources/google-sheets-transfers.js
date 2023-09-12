const { fetchTransfers } = require('@kammy/helpers.spreadsheet');

module.exports = (googleDivisionData) => {
    const transferPromises = googleDivisionData.map((data) =>
        fetchTransfers(data.spreadsheetKey).then((rows) => rows.map((row) => ({ ...row, divisionId: data.id }))),
    );
    return Promise.all(transferPromises).then((result) =>
        result.reduce((prev, curr) => {
            prev.push(...curr);
            return prev;
        }, []),
    );
};
