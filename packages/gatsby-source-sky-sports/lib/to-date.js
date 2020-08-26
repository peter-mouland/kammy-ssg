const parseISO = require('date-fns/parseISO');

module.exports = (string = '') => {
    if (!string) return string;
    return parseISO(string);
};
