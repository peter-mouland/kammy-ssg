const { fetchSetup } = require('@kammy/helpers.spreadsheet');

module.exports = ({ season } = {}) => fetchSetup('GameWeeks', { season });
