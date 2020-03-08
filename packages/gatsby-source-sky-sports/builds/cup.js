const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleCupData }) => {
  return googleCupData.map((cup) => {
      const data = {
        status: cup.status,
        timestamp: cup.timestamp,
        row: cup.__row,
        group: cup.group.trim(),
        gameWeek: cup.gameweek,
        round: cup.round.trim(),
        manager: cup.manager.trim(),
        player1: cup.player1.trim(),
        player2: cup.player2.trim(),
        player3: cup.player3.trim(),
        player4: cup.player4.trim(),
      };
      return {
          resourceId: `cup-${data.gameWeek}-${data.row}`,
          data,
          internal: {
              description: 'Cup',
              mediaType: mediaTypes.JSON,
              type: nodeTypes.cup,
          },
      };
  });
};

