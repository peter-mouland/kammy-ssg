const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googlePlayerData, skyPlayers }) => {
  const skyPlayersObj = skyPlayers.reduce((prev, { data: player }) => ({
    ...prev,
    [player.name]: {
      ...(prev[player.name] || {}),
      ...player,
    }
  }), {});
  const googlePlayersObj = googlePlayerData.reduce((prev, player) => ({
    ...prev,
    [player.Player.trim()]: {
      ...(prev[player.Player.trim()] || {}),
      isHidden: ['hidden', 'y', 'Y'].includes(player.isHidden),
      new: ['new', 'y', 'Y'].includes(player.new),
      code: parseInt(player.Code, 10),
      club: player.Club,
      pos: player.Position.toUpperCase(),
      name: player.Player.trim(),
    }
  }), {});
    const mergedPlayers = Object.keys(skyPlayersObj)
      .reduce((prev, player) => ({
        ...prev,
        [player]: {
          isHidden: googlePlayersObj[player] ? googlePlayersObj[player].isHidden : false,
          new: googlePlayersObj[player] ? googlePlayersObj[player].new : true,
          pos: googlePlayersObj[player] ? googlePlayersObj[player].pos : '',
          fixtures: skyPlayersObj[player].fixtures,
          value: skyPlayersObj[player].value,
          name: skyPlayersObj[player].name,
          code: skyPlayersObj[player].code,
          club: skyPlayersObj[player].club,
          skySportsPosition: skyPlayersObj[player].pos,
        },
      }), {});

  return Object.values(mergedPlayers).map((player) => {
      return {
          resourceId: `players-${player.name}`,
          data: player,
          internal: {
              description: 'Players',
              mediaType: mediaTypes.JSON,
              type: nodeTypes.players,
          },
      };
  });
};

