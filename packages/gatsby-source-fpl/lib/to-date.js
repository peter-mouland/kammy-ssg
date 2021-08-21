const parseISOimport = require('date-fns/parseISO');

const parseISO = parseISOimport.default || parseISOimport;

module.exports = (string = '') => {
    if (!string) return string;
    return parseISO(string);
};
