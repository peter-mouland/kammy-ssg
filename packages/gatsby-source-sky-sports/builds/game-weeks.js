const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleGameWeekData }) => {
  return googleGameWeekData.map((gw) => {
      const data = {
        notes: gw.notes || '',
        cup: ['cup', 'y', 'yes', 'Y'].includes(gw.cup || ''),
        gameWeek: gw.gameweek,
        start: gw.start,
        end: gw.end,
        isCurrent: new Date() < new Date(gw.end) && new Date() > new Date(gw.start)
      };
      return {
          resourceId: `game-weeks-${gw.gameWeek}-${gw.start}-${gw.end}`,
          data,
          internal: {
              description: 'Game Weeks',
              mediaType: mediaTypes.JSON,
              type: nodeTypes.gameWeeks,
          },
      };
  });
};

