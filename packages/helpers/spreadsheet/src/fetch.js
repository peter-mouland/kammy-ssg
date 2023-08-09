const { spreadsheets } = require('./constants');

const rowToObj = ({ values = [] }) => {
    const sheetCols = 'abcdefghijklmnopqrstuvwxyz';
    const headers = values.splice(0, 1)[0]; // remove and extract headers row
    const data = values.map((row, rowIndex) =>
        row.reduce(
            (prev, col, colIndex) => ({
                ...prev,
                __row: rowIndex + 2,
                [headers[colIndex]]: col,
                [`${headers[colIndex]}__range`]: `${sheetCols.charAt(colIndex)}${rowIndex + 2}`,
            }),
            {},
        ),
    );
    return data;
};

const GS_API = (spreadsheet, endpoint, opts = {}) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet}${endpoint}`;
    console.log(url, opts);
    const fullUrl = Object.keys(opts).reduce(
        (prev, opt) => `${prev}${opts[opt] === true ? `&${opt}=true` : ''}`,
        `${url}?key=${spreadsheets.ACCESS_KEY}`,
    );
    return fetch(fullUrl, { season: opts.season })
        .then((response) => (response.json ? response.json() : response))
        .then(rowToObj);
};

module.exports = GS_API;
