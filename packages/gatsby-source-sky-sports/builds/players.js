const { playerStats } = require('@kammy/data.player-stats');

const { nodeTypes, mediaTypes } = require('../lib/constants');

const calculateSeasonStats = (gameWeeksWithFixtures) => (
  gameWeeksWithFixtures.reduce((totals, gw) => (
    Object.keys(gw.stats).reduce((prev, stat) => ({
      ...prev,
      [stat]: gw.stats[stat] + (totals[stat] || 0),
    }), {})
  ), {})
);

const getGameWeeksWithFixtures = ({ player, gameWeeks }) => (
  gameWeeks.map((gw) => {
    const { gameWeekFixtures, gameWeekStats } = playerStats({ player, gameWeeks: [gw] });
    return { fixtures: gameWeekFixtures, stats: gameWeekStats };
  })
);

const getPlayerWithStats = ({ player, dbPlayer, gameWeeks, gameWeekIndex }) => {
  const gameWeek = gameWeekIndex < 0 ? 0 : gameWeekIndex;
  const playerWithNonZeroFixtures = {
    ...player,
    fixtures: (player.fixtures || []).map((fixture, i) => {
      const sumStats = (fixture.stats || []).reduce((acc, value) => acc + value, 0);
      return {
        ...fixture,
        stats: dbPlayer && sumStats === 0 ? dbPlayer.fixtures[i].stats : fixture.stats, // don't override with zeros
      };
    }),
  };

  const gameWeeksWithFixtures = getGameWeeksWithFixtures({ player: playerWithNonZeroFixtures, gameWeeks });
  const season = calculateSeasonStats(gameWeeksWithFixtures);

  return {
    ...playerWithNonZeroFixtures,
    gameWeeks: gameWeeksWithFixtures,
    gameWeek: gameWeeksWithFixtures[gameWeek].stats,
    season,
  };
};

module.exports = ({ googlePlayerData, gameWeeks, skyPlayers }) => {
  const gameWeekData = gameWeeks.map(({ data }) => data);
  const gameWeekIndex = gameWeekData.findIndex((gw) => gw.isCurrent);
  const skyPlayersObj = skyPlayers.reduce((prev, { data: player }) => ({
    ...prev,
    [player.name]: {
      ...(prev[player.name] || {}),
      ...player,
    }
  }), {});
  const googlePlayersObj = googlePlayerData.reduce((prev, googlePlayer) => {
    const player = {
      ...(prev[googlePlayer.Player.trim()] || {}),
      isHidden: ['hidden', 'y', 'Y'].includes(googlePlayer.isHidden),
      new: ['new', 'y', 'Y'].includes(googlePlayer.new),
      code: parseInt(googlePlayer.Code, 10),
      club: googlePlayer.Club,
      pos: googlePlayer.Position.toUpperCase(),
      name: googlePlayer.Player.trim(),
    };
    return {
      ...prev,
      [player.name]: player,
    }
  }, {});
  const mergedPlayers = Object.keys(skyPlayersObj)
    .reduce((prev, playerName) => {
      const player = {
        isHidden: googlePlayersObj[playerName] ? googlePlayersObj[playerName].isHidden : false,
        new: googlePlayersObj[playerName] ? googlePlayersObj[playerName].new : true,
        pos: googlePlayersObj[playerName] ? googlePlayersObj[playerName].pos : '',
        fixtures: skyPlayersObj[playerName].fixtures,
        value: skyPlayersObj[playerName].value,
        name: skyPlayersObj[playerName].name,
        code: skyPlayersObj[playerName].code,
        club: skyPlayersObj[playerName].club,
        skySportsPosition: skyPlayersObj[playerName].pos,
      };
      const playerWithStats = getPlayerWithStats({ player, gameWeeks: gameWeekData, gameWeekIndex });
      return {
        ...prev,
        [playerName]: playerWithStats,
      }
    }, {});

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

