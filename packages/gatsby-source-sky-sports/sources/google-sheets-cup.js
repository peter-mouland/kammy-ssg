const fetch = require('../lib/fetch-google-spreadsheet');
const { spreadsheets } = require('../lib/constants');

/* CUP */
const formatCupPlayer = ({
  status = '', timestamp = '', group = '', gameweek, round = '', manager = '', player1 = '', player2 = '', player3 = '', player4 = '',
  __row,
}) => ({
  status,
  timestamp,
  row: __row,
  group: group.trim(),
  gameWeek: gameweek,
  round: round.trim(),
  manager: manager.trim(),
  player1: player1.trim(),
  player2: player2.trim(),
  player3: player3.trim(),
  player4: player4.trim(),
});
const formatCup = (data = []) => data.map(formatCupPlayer);

module.exports = () => fetch(spreadsheets.TRANSFERS_ID, '/values/cup').then(formatCup);
