const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googlePlayerData }) => {
  return googlePlayerData.map((player) => {
      const data = {
        isHidden: ['hidden', 'y', 'Y'].includes(player.isHidden),
        new: ['new', 'y', 'Y'].includes(player.new),
        code: parseInt(player.Code, 10),
        pos: player.Pos.toUpperCase(),
        name: player.Player.trim(),
      };
      return {
          resourceId: `players-${data.name}`,
          data,
          internal: {
              description: 'Players',
              mediaType: mediaTypes.JSON,
              type: nodeTypes.players,
          },
      };
  });
};

