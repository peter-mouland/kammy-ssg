const { fetchSetup } = require('@kammy/helpers.spreadsheet');

module.exports = (googleDivisionData) => {
    const divisions = googleDivisionData.map((data) =>
        fetchSetup(data.spreadsheetKey).then((rows) => rows.map((row) => ({ ...row, divisionId: data.id }))),
    );
    return Promise.all(divisions).then((result) =>
        result.reduce((prev, curr) => {
            prev.push(...curr);
            return prev;
        }, []),
    );
};
