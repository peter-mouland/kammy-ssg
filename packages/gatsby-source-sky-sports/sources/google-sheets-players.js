const toDate = require('../lib/to-date');
const fetch = require('../lib/fetch-google-spreadsheet');
const { spreadsheets } = require('../lib/constants');

/* PLAYERS */
const formatPlayer = ({
  Player = '', isHidden = '', Code, Pos = '', ...item
}) => ({
  [(Player || '').trim()]: {
    isHidden: ['hidden', 'y', 'Y'].includes(isHidden),
    new: ['new', 'y', 'Y'].includes(item.new),
    code: parseInt(Code, 10),
    pos: Pos.toUpperCase(),
    name: Player.trim(),
  },
});

const formatPlayers = (data) => data.map(formatPlayer);

module.exports = () => fetch(spreadsheets.SETUP_ID, '/values/Players').then(formatPlayers);
